"""Recommendation side effects for emotion detection endpoints."""

import logging
from datetime import datetime

from assistant.services.microservice_clients import (
    call_recommendation_microservice,
    get_user_recommendation_preferences,
)

logger = logging.getLogger(__name__)


class RecommendationSideEffectsService:
    @staticmethod
    def fetch_recommendations_for_detected_emotion(
        user,
        predicted_emotion,
        confidence,
        detection_method,
        emotion_mapping,
        notification_service=None,
        recommendation_storage_service=None,
    ):
        try:
            mapped_emotion = emotion_mapping.get(predicted_emotion.lower(), 'neutral')

            context = {
                'time_of_day': RecommendationSideEffectsService._get_time_of_day(),
                'confidence': confidence,
                'detection_method': detection_method,
            }

            user_preferences = get_user_recommendation_preferences(user)

            recommendations_data = call_recommendation_microservice(
                user_id=str(user.id),
                emotion=mapped_emotion,
                context=context,
                preferences=user_preferences,
            )

            if recommendations_data and notification_service:
                try:
                    if recommendation_storage_service:
                        user_recommendation = recommendation_storage_service.store_recommendations_from_microservice(
                            user=user,
                            emotion=mapped_emotion,
                            recommendations_data=recommendations_data
                        )
                        if user_recommendation:
                            logger.info(f"Stored recommendation for user {user.id}")

                    if notification_service.should_send_notification(user, 'recommendation'):
                        notification_service.create_recommendation_notification(
                            user=user,
                            recommendation_title=f"Recommendations for {predicted_emotion} mood",
                            recommendation_id=None
                        )
                except Exception as exc:
                    logger.error(f"Error creating recommendation notification: {exc}")

            return recommendations_data

        except Exception as exc:
            logger.error(f"Error fetching recommendations: {exc}")
            return None

    @staticmethod
    def _get_time_of_day():
        current_hour = datetime.now().hour
        if 5 <= current_hour < 12:
            return 'morning'
        if 12 <= current_hour < 17:
            return 'afternoon'
        if 17 <= current_hour < 21:
            return 'evening'
        return 'night'
