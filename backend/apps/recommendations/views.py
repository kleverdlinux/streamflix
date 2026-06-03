"""
Recommendations app views.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Recommendation
from .serializers import RecommendationSerializer, MatchScoreSerializer
from .recommender import RecommenderService
from apps.movies.models import Movie
from apps.movies.serializers import MovieListSerializer

logger = logging.getLogger(__name__)


def api_response(data=None, message='', success=True, status_code=200, errors=None):
    body = {'success': success, 'data': data, 'message': message}
    if errors:
        body['errors'] = errors
    return Response(body, status=status_code)


def _movies_as_rec_format(movies, score=1.0):
    """
    Wrap flat movie serializer data into the {movie: {...}, score: ...} format
    that ForYou.jsx expects (same shape as RecommendationSerializer).
    """
    movie_data = MovieListSerializer(movies, many=True).data
    return [{'id': None, 'movie': m, 'score': score, 'rank': i + 1,
             'model_version': 'fallback', 'expires_at': None, 'generated_at': None}
            for i, m in enumerate(movie_data)]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommendation_list(request):
    """
    GET /api/recommendations/
    Priority: cache → hybrid (SVD in model) → cold-start → popular fallback.
    Always returns data in {movie: {...}, score: ...} format.
    """
    user = request.user
    now = timezone.now()

    # ── 1. Check cache ──────────────────────────────────────
    try:
        cached = Recommendation.objects.filter(
            user=user, expires_at__gt=now
        ).select_related('movie').order_by('rank')

        if cached.count() >= 10:
            data = RecommendationSerializer(cached, many=True).data
            return api_response(data=data, message='Recomendaciones desde caché.')
    except Exception as e:
        logger.error(f"Cache check failed: {e}")

    # ── 2. Get service ──────────────────────────────────────
    try:
        service = RecommenderService.get_instance()
    except Exception as e:
        logger.error(f"RecommenderService instantiation failed: {e}")
        service = None

    # ── 3. Plan Tier Logic ──────────────────────────────────
    try:
        user_sub = user.usersubscription_set.filter(status='active').select_related('plan').first()
        plan_id = user_sub.plan.id if user_sub else 1
        ai_priority = user_sub.plan.ai_priority if user_sub else 1
    except Exception as e:
        logger.error(f"Failed to fetch user plan: {e}")
        plan_id = 1
        ai_priority = 1
        
    # AI Precision: Higher plans get more recommendations and deeper search
    n_recs = 10 + (ai_priority * 5)  # Gratuito(1)=15, Premium(4)=30

    # ── 4. Interaction Check & Generate ─────────────────────
    try:
        from apps.ratings.models import Rating, WatchHistory
        from django.db import connection
        
        user_rating_count = Rating.objects.filter(user=user).count()
        user_watch_count = WatchHistory.objects.filter(user=user).count()
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM user_watchlist WHERE user_id = %s", [user.id])
            user_wl_count = cursor.fetchone()[0]
            
        total_interactions = user_rating_count + user_watch_count + user_wl_count

        # If user has absolutely zero interactions, return empty to show a clean state
        if total_interactions == 0:
            return api_response(data=[], message='Califica o agrega películas a tu lista para que la IA aprenda tus gustos.')

        recs = []
        source = 'none'

        if service and service.loaded:
            db_recs = service.get_db_personalized_recommendations(
                user.id, n=n_recs * 3, plan_id=plan_id
            )
            if db_recs:
                movie_ids = [mid for mid, _ in db_recs]
                from django.db.models import Q
                allowed = set(
                    Movie.objects.filter(
                        Q(min_plan_id__lte=plan_id) | Q(min_plan_id__isnull=True),
                        id__in=movie_ids, is_active=True
                    ).values_list('id', flat=True)
                )
                recs = [(mid, score) for mid, score in db_recs if mid in allowed][:n_recs]
                source = 'db_personalized'
                logger.info(f"DB-personalized: {len(recs)} recs for user {user.id}")

    except Exception as e:
        logger.error(f"Recommendation generation failed for user {user.id}: {e}")
        recs = []

    # ── 6. If still empty → popular fallback ────────────────
    if not recs:
        logger.warning(f"No recs generated for user {user.id} — using popular fallback.")
        from django.db.models import Q
        movies = Movie.objects.filter(Q(min_plan_id__lte=plan_id) | Q(min_plan_id__isnull=True), is_active=True).order_by('-weighted_rating')[:n_recs]
        data = _movies_as_rec_format(movies, score=0.5)
        return api_response(data=data, message='Recomendaciones populares.')

    # ── 6. Save to cache ────────────────────────────────────
    try:
        from django.db import transaction
        with transaction.atomic():
            Recommendation.objects.filter(user=user).delete()
            expires = now + timedelta(hours=24)

            for rank, (movie_id, score) in enumerate(recs, 1):
                Recommendation.objects.get_or_create(
                    user=user,
                    movie_id=movie_id,
                    defaults={
                        'score': round(float(score), 6),
                        'rank': rank,
                        'model_version': '1.0',
                        'expires_at': expires,
                    }
                )
    except Exception as e:
        logger.error(f"Cache save failed: {e}")

    # ── 7. Return from DB (with full movie data) ─────────────
    try:
        saved = Recommendation.objects.filter(
            user=user, expires_at__gt=now
        ).select_related('movie').order_by('rank')

        if saved.count() > 0:
            data = RecommendationSerializer(saved, many=True).data
            return api_response(data=data, message='Recomendaciones generadas.')
    except Exception as e:
        logger.error(f"Final fetch failed: {e}")

    # ── 8. Last resort: return from memory ──────────────────
    movie_ids = [mid for mid, _ in recs]
    movies = Movie.objects.filter(id__in=movie_ids, is_active=True)
    movies_dict = {m.id: m for m in movies}
    ordered = [movies_dict[mid] for mid, _ in recs if mid in movies_dict]
    data = _movies_as_rec_format(ordered)
    return api_response(data=data, message='Recomendaciones (sin caché).')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def similar_movies(request, movie_id):
    """GET /api/recommendations/similar/{movie_id}/"""
    try:
        movie = Movie.objects.get(id=movie_id)
    except Movie.DoesNotExist:
        return api_response(success=False, message='Película no encontrada.', status_code=404)

    if not movie.movielens_id:
        return api_response(data=[])

    try:
        service = RecommenderService.get_instance()
        if not service or not service.loaded:
            return api_response(data=[])

        recs = service.get_content_recommendations(movie.movielens_id, n=12)
        movie_ids = [r[0] for r in recs]
        movies = Movie.objects.filter(id__in=movie_ids, is_active=True)
        movies_dict = {m.id: m for m in movies}
        ordered = [movies_dict[mid] for mid in movie_ids if mid in movies_dict]
        data = MovieListSerializer(ordered, many=True).data
        return api_response(data=data)
    except Exception as e:
        logger.error(f"Similar movies failed: {e}")
        return api_response(data=[])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_score(request, movie_id):
    """GET /api/recommendations/match-score/{movie_id}/"""
    try:
        service = RecommenderService.get_instance()
        if not service or not service.loaded:
            return api_response(data={'movie_id': movie_id, 'probability': 0.5, 'will_like': True})

        prob = service.predict_will_like(request.user.id, movie_id)
        return api_response(data={
            'movie_id': movie_id,
            'probability': round(prob, 4),
            'will_like': prob >= 0.5,
        })
    except Exception as e:
        logger.error(f"Match score failed: {e}")
        return api_response(data={'movie_id': movie_id, 'probability': 0.5, 'will_like': True})
