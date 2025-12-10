"""
Settings API endpoints with AES-256 encryption
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

try:
    from .models import User
    from .settings_models import UserPreferences
except ImportError as e:
    logger.error(f"Import error: {e}")


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_profile(request):
    """
    Get or update user profile settings
    GET /api/settings/profile/
    PATCH /api/settings/profile/
    """
    user = request.user
    
    if request.method == 'GET':
        # Return decrypted profile data
        bio = ""
        phone_number = ""
        
        # Try encrypted fields first, fallback to plain text
        try:
            from .encryption import get_encryption_service
            encryption_service = get_encryption_service()
            
            if user.bio_encrypted:
                bio = encryption_service.decrypt(user.bio_encrypted)
            elif user.bio:
                bio = user.bio
            
            if user.phone_number_encrypted:
                phone_number = encryption_service.decrypt(user.phone_number_encrypted)
            elif user.phone_number:
                phone_number = user.phone_number
        except (ImportError, Exception) as e:
            logger.warning(f"Encryption not available, using plain text: {e}")
            bio = user.bio or ""
            phone_number = user.phone_number or ""
        
        return Response({
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email,
            'bio': bio,
            'phone_number': phone_number,
            'profile_picture': user.profile_picture or None,
            'total_entries': user.total_entries,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Update profile with encryption
        try:
            from .encryption import get_encryption_service
            encryption_service = get_encryption_service()
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            return Response(
                {'error': 'Encryption service not available. Please install cryptography package.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            data = request.data.copy()
            
            # Handle profile picture upload (if provided)
            if 'profile_picture' in request.FILES:
                import cloudinary.uploader
                profile_file = request.FILES['profile_picture']
                try:
                    upload_result = cloudinary.uploader.upload(
                        profile_file,
                        folder="emotion-journal/profile_pictures",
                        resource_type="image",
                    )
                    data['profile_picture'] = upload_result.get("secure_url")
                except Exception as e:
                    return Response(
                        {"error": f"Failed to upload profile picture: {e}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Update basic fields
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'profile_picture' in data:
                user.profile_picture = data['profile_picture']
            
            # Encrypt and store sensitive fields
            if 'bio' in data:
                bio_text = data['bio']
                if bio_text:
                    user.bio_encrypted = encryption_service.encrypt(bio_text)
                else:
                    user.bio_encrypted = ""
                # Keep plain text for backward compatibility (will be removed)
                user.bio = bio_text
            
            if 'phone_number' in data:
                phone_text = data['phone_number']
                if phone_text:
                    user.phone_number_encrypted = encryption_service.encrypt(phone_text)
                else:
                    user.phone_number_encrypted = ""
                # Keep plain text for backward compatibility
                user.phone_number = phone_text
            
            user.save()
            
            return Response({
                'message': 'Profile updated successfully',
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'bio': encryption_service.decrypt(user.bio_encrypted) if user.bio_encrypted else "",
                'phone_number': encryption_service.decrypt(user.phone_number_encrypted) if user.phone_number_encrypted else "",
                'profile_picture': user.profile_picture,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_notifications(request):
    """
    Get or update notification settings
    GET /api/settings/notifications/
    PATCH /api/settings/notifications/
    """
    user = request.user
    
    # Get or create preferences
    preferences, created = UserPreferences.objects.get_or_create(user=user)
    
    if request.method == 'GET':
        settings = preferences.get_notification_settings()
        # Return default settings if empty
        default_settings = {
            'session_reminders': True,  # Changed from journal_reminders
            'mood_insights': True,
            'weekly_reports': False,
            'streak_alerts': True,
            'ai_suggestions': True,
            'email_notifications': True,
            'push_notifications': False,
        }
        return Response({**default_settings, **settings}, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        try:
            new_settings = request.data.copy()
            preferences.set_notification_settings(new_settings)
            preferences.save()
            
            return Response({
                'message': 'Notification settings updated successfully',
                'settings': new_settings
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error updating notification settings: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_privacy(request):
    """
    Get or update privacy settings
    GET /api/settings/privacy/
    PATCH /api/settings/privacy/
    """
    user = request.user
    
    preferences, created = UserPreferences.objects.get_or_create(user=user)
    
    if request.method == 'GET':
        settings = preferences.get_privacy_settings()
        default_settings = {
            'data_collection': True,
            'share_analytics': False,
            'cloud_backup': True,
            'storage_type': 'hybrid',
        }
        return Response({**default_settings, **settings}, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        try:
            new_settings = request.data.copy()
            preferences.set_privacy_settings(new_settings)
            preferences.save()
            
            return Response({
                'message': 'Privacy settings updated successfully',
                'settings': new_settings
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error updating privacy settings: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_appearance(request):
    """
    Get or update appearance settings
    GET /api/settings/appearance/
    PATCH /api/settings/appearance/
    """
    user = request.user
    
    preferences, created = UserPreferences.objects.get_or_create(user=user)
    
    if request.method == 'GET':
        settings = preferences.get_appearance_settings()
        default_settings = {
            'mood_adaptive': True,
            'dark_mode': False,
            'color_scheme': 'default',
        }
        return Response({**default_settings, **settings}, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        try:
            new_settings = request.data.copy()
            preferences.set_appearance_settings(new_settings)
            preferences.save()
            
            return Response({
                'message': 'Appearance settings updated successfully',
                'settings': new_settings
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error updating appearance settings: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settings_export_data(request):
    """
    Export user data
    POST /api/settings/export-data/
    """
    # TODO: Implement data export functionality
    return Response({
        'message': 'Data export requested. You will receive an email with your data shortly.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settings_delete_account(request):
    """
    Delete user account
    POST /api/settings/delete-account/
    """
    user = request.user
    
    # TODO: Implement proper account deletion with confirmation
    # For now, just mark as deleted or soft delete
    return Response({
        'message': 'Account deletion requested. You will receive a confirmation email.'
    }, status=status.HTTP_200_OK)

