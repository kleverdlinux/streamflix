"""
Ratings app views — rate movies, list reviews, track watch history.
"""
from django.db.models import Avg, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Rating, WatchHistory
from .serializers import RatingSerializer, RateMovieSerializer, WatchSerializer
from apps.movies.models import Movie, MoviePerson
from apps.recommendations.models import Recommendation, UserActorPreference


def api_response(data=None, message='', success=True, status_code=200, errors=None):
    body = {'success': success, 'data': data, 'message': message}
    if errors:
        body['errors'] = errors
    return Response(body, status=status_code)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_movie(request, pk):
    """POST /api/movies/{id}/rate/ — upsert rating + recalculate movie stats."""
    try:
        movie = Movie.objects.get(id=pk)
    except Movie.DoesNotExist:
        return api_response(success=False, message='Película no encontrada.', status_code=404)

    serializer = RateMovieSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    data = serializer.validated_data

    # Upsert
    rating_obj, created = Rating.objects.update_or_create(
        user=request.user,
        movie=movie,
        defaults={
            'rating': data['rating'],
            'liked': data.get('liked'),
            'review': data.get('review', ''),
        }
    )

    # Recalculate movie avg_rating and num_ratings
    stats = Rating.objects.filter(movie=movie).aggregate(
        avg=Avg('rating'), count=Count('id')
    )
    movie.avg_rating = round(stats['avg'] or 0, 2)
    movie.num_ratings = stats['count']
    movie.save(update_fields=['avg_rating', 'num_ratings'])

    # Invalidate recommendation cache
    Recommendation.objects.filter(user=request.user).delete()

    return api_response(
        data=RatingSerializer(rating_obj).data,
        message='Calificación registrada.' if created else 'Calificación actualizada.',
        status_code=201 if created else 200,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def movie_ratings(request, pk):
    """GET /api/movies/{id}/ratings/ — latest 20 reviews."""
    ratings = Rating.objects.filter(
        movie_id=pk
    ).select_related('user').order_by('-created_at')[:20]

    data = RatingSerializer(ratings, many=True).data
    return api_response(data=data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def watch_movie(request, pk):
    """POST /api/movies/{id}/watch/ — record watch history."""
    try:
        movie = Movie.objects.get(id=pk)
    except Movie.DoesNotExist:
        return api_response(success=False, message='Película no encontrada.', status_code=404)

    serializer = WatchSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    data = serializer.validated_data

    # Always insert (it's a history log)
    WatchHistory.objects.create(
        user=request.user,
        movie=movie,
        progress_pct=data['progress_pct'],
        completed=data['completed'],
        device_type=data['device_type'],
    )

    # If completed, update actor preferences
    if data['completed']:
        actors = MoviePerson.objects.filter(
            movie=movie, role='actor'
        ).values_list('person_id', flat=True)

        for person_id in actors:
            pref, created = UserActorPreference.objects.get_or_create(
                user=request.user,
                person_id=person_id,
                defaults={'weight': 0.1}
            )
            if not created:
                pref.weight = float(pref.weight) + 0.1
                pref.save(update_fields=['weight'])

    return api_response(message='Historial registrado.', status_code=201)
