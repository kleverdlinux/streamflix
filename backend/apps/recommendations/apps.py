from django.apps import AppConfig
import logging
import sys

logger = logging.getLogger(__name__)


class RecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.recommendations'
    label = 'recommendations'

    def ready(self):
        """Initialize the RecommenderService singleton when Django starts."""
        # Skip initialization during common management commands to avoid database queries on startup
        if 'manage.py' in sys.argv and any(cmd in sys.argv for cmd in ['migrate', 'collectstatic', 'makemigrations', 'check', 'test']):
            logger.info("RecommenderService initialization skipped during management command.")
            return

        try:
            from .recommender import RecommenderService
            RecommenderService.get_instance()
            logger.info("RecommenderService initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize RecommenderService: {e}")
