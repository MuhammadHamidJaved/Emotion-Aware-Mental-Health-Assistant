"""
Helper service for storing recommendations
"""
import logging
from typing import Dict, Optional
from django.utils import timezone
from .models import Recommendation, UserRecommendation

logger = logging.getLogger(__name__)

class RecommendationStorageService:
    """Service for storing and managing recommendations"""
    
    @staticmethod
    def store_recommendations_from_microservice(user, emotion: str, recommendations_data: Dict) -> Optional[UserRecommendation]:
        """
        Store recommendations from microservice response
        
        Args:
            user: User object
            emotion: Detected emotion
            recommendations_data: Data from recommendation microservice
        
        Returns:
            UserRecommendation object if created, None otherwise
        """
        if not recommendations_data or not isinstance(recommendations_data, dict):
            logger.warning("Invalid recommendations_data provided")
            return None
        
        recommendations = recommendations_data.get('recommendations', {})
        if not recommendations:
            logger.warning("No recommendations found in microservice response")
            return None
        
        try:
            # Create or get Recommendation object
            recommendation_title = f"{emotion.capitalize()} Mood Support"
            
            # Build description from microservice data
            description_parts = []
            
            if recommendations.get('quote'):
                description_parts.append(f"Quote: {recommendations['quote']}")
            
            if recommendations.get('activity'):
                description_parts.append(f"Activity: {recommendations['activity']}")
            
            if recommendations.get('music'):
                music = recommendations['music']
                if isinstance(music, dict):
                    description_parts.append(f"Music: {music.get('name', 'Recommended playlist')}")
                elif isinstance(music, str):
                    description_parts.append(f"Music: {music}")
            
            if recommendations.get('meditation'):
                description_parts.append(f"Meditation: {recommendations['meditation']}")
            
            description = " | ".join(description_parts) if description_parts else "Personalized recommendations"
            
            # Create or update Recommendation
            recommendation, created = Recommendation.objects.get_or_create(
                title=recommendation_title,
                category=emotion,
                defaults={'description': description}
            )
            
            if created:
                # Set encrypted fields
                recommendation.set_title(recommendation_title)
                recommendation.set_description(description)
                recommendation.save()
                logger.info(f"Created new Recommendation: {recommendation_title}")
            
            # Create UserRecommendation to assign it to the user
            user_recommendation, created = UserRecommendation.objects.get_or_create(
                user=user,
                recommendation=recommendation,
                defaults={
                    'triggered_by': f"emotion_detection_{emotion}",
                    'priority': 5
                }
            )
            
            if created:
                logger.info(f"Assigned recommendation to user {user.id}")
            else:
                # Update timestamp if already exists
                user_recommendation.updated_at = timezone.now()
                user_recommendation.save()
                logger.info(f"Updated existing user recommendation for user {user.id}")
            
            return user_recommendation
            
        except Exception as e:
            logger.error(f"Error storing recommendations: {str(e)}")
            return None
    
    @staticmethod
    def get_user_recommendations(user, limit: int = 10, only_active: bool = True):
        """
        Get recommendations for a user
        
        Args:
            user: User object
            limit: Maximum number of recommendations to return
            only_active: Only return non-dismissed, non-completed recommendations
        
        Returns:
            QuerySet of UserRecommendation objects
        """
        queryset = UserRecommendation.objects.filter(user=user)
        
        if only_active:
            queryset = queryset.filter(is_completed=False, is_dismissed=False)
        
        return queryset.select_related('recommendation')[:limit]
