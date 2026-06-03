from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class RecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.recommendations'
    label = 'recommendations'

    def ready(self):
        """Initialize the RecommenderService singleton when Django starts."""
        try:
            from .recommender import RecommenderService
            RecommenderService.get_instance()
            logger.info("RecommenderService initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize RecommenderService: {e}")
