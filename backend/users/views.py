from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
import cloudinary.uploader

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    OnboardingSerializer,
    get_tokens_for_user,
)
from .settings_models import UserPreferences


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Creates a new user account and returns JWT tokens + basic user data.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Account created successfully.",
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/

    Logs in a user with email + password and returns JWT tokens + user data.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    GET /api/auth/me/

    Returns the authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        # Update stats if they haven't been calculated yet
        if user.total_entries == 0:
            user.update_stats()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        PATCH /api/auth/me/

        Allows the authenticated user to update their own profile.
        Supports multipart form data for profile_picture uploads which are
        uploaded to Cloudinary and stored as a URL on the user model.
        """

        user = request.user

        # Make a mutable copy of incoming data
        data = request.data.copy()

        # Handle optional profile picture upload
        profile_file = request.FILES.get("profile_picture")
        if profile_file:
            try:
                upload_result = cloudinary.uploader.upload(
                    profile_file,
                    folder="emotion-journal/profile_pictures",
                    resource_type="image",
                )
                data["profile_picture"] = upload_result.get("secure_url")
            except Exception as e:  # pragma: no cover - safety net
                return Response(
                    {"detail": f"Failed to upload profile picture: {e}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Normalize JSON-like fields coming from simple text inputs
        concerns = data.get("mental_health_concerns")
        if isinstance(concerns, str):
            items = [s.strip() for s in concerns.split(",") if s.strip()]
            data["mental_health_concerns"] = items

        goals = data.get("mood_tracking_goals")
        if isinstance(goals, str):
            items = [s.strip() for s in goals.split(",") if s.strip()]
            data["mood_tracking_goals"] = items

        serializer = UserSerializer(user, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class OnboardingView(APIView):
    """
    POST /api/auth/onboarding/
    
    Saves user onboarding preferences including storage choice and feature permissions.
    Marks the user's onboarding as complete.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        storage_choice = serializer.validated_data['storage']
        permissions = serializer.validated_data['permissions']
        
        try:
            # Get or create user preferences
            preferences, created = UserPreferences.objects.get_or_create(user=user)
            
            # Store onboarding settings (storage + permissions)
            onboarding_data = {
                'storage': storage_choice,
                'permissions': permissions,
                'completed_at': timezone.now().isoformat()
            }
            preferences.set_onboarding_settings(onboarding_data)
            preferences.save()
            
            # Update privacy settings with storage preference
            privacy_settings = preferences.get_privacy_settings()
            privacy_settings['storage_type'] = storage_choice
            privacy_settings['cloud_backup'] = storage_choice in ['cloud', 'hybrid']
            preferences.set_privacy_settings(privacy_settings)
            preferences.save()
            
            # Update notification settings based on permissions
            notification_settings = preferences.get_notification_settings()
            notification_settings['push_notifications'] = permissions.get('notifications', False)
            notification_settings['email_notifications'] = permissions.get('notifications', False)
            preferences.set_notification_settings(notification_settings)
            preferences.save()
            
            # Update user model fields based on permissions
            user.enable_biometric = permissions.get('biometric', False)
            user.enable_notifications = permissions.get('notifications', True)
            user.onboarding_complete = True
            user.save()
            
            return Response(
                {
                    "message": "Onboarding completed successfully.",
                    "storage": storage_choice,
                    "permissions": permissions,
                    "onboarding_complete": True,
                },
                status=status.HTTP_200_OK,
            )
        
        except Exception as e:
            return Response(
                {"detail": f"Failed to save onboarding preferences: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
    def get(self, request):
        """
        GET /api/auth/onboarding/
        
        Returns the user's onboarding status and preferences.
        """
        user = request.user
        
        try:
            preferences = UserPreferences.objects.filter(user=user).first()
            
            if not preferences:
                return Response(
                    {
                        "onboarding_complete": user.onboarding_complete,
                        "storage": None,
                        "permissions": {},
                    },
                    status=status.HTTP_200_OK,
                )
            
            onboarding_data = preferences.get_onboarding_settings()
            
            return Response(
                {
                    "onboarding_complete": user.onboarding_complete,
                    "storage": onboarding_data.get('storage'),
                    "permissions": onboarding_data.get('permissions', {}),
                },
                status=status.HTTP_200_OK,
            )
        
        except Exception as e:
            return Response(
                {"detail": f"Failed to retrieve onboarding preferences: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
