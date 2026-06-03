from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class RecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.recommendations'
    label = 'recommendations'

    def ready(self):
        """
        RecommenderService will be loaded lazily on the first API request
        via RecommenderService.get_instance() to save memory at startup.
        This is critical for free-tier hosting with 512MB RAM limits.
        """
        logger.info("RecommendationsConfig ready. ML models will load on first request.")
