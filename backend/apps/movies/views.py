"""
Movies app views — catalog browsing, filtering, and genre endpoints.
"""
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Movie, Genre, MovieGenre
from .serializers import MovieListSerializer, MovieDetailSerializer, GenreSerializer


def api_response(data=None, message='', success=True, status_code=200, errors=None, pagination=None):
    body = {'success': success, 'data': data, 'message': message}
    if errors:
        body['errors'] = errors
    if pagination:
        body['pagination'] = pagination
    return Response(body, status=status_code)


def paginate_queryset(queryset, request, serializer_class):
    """Manual pagination helper."""
    page = int(request.query_params.get('page', 1))
    page_size = min(int(request.query_params.get('page_size', 20)), 1000)
    total = queryset.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    end = start + page_size

    items = queryset[start:end]
    data = serializer_class(items, many=True).data

    return api_response(
        data=data,
        pagination={
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
        }
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def movie_list(request):
    """GET /api/movies/ with filtering, search, ordering, pagination."""
    qs = Movie.objects.filter(is_active=True)

    # Filters
    genre = request.query_params.get('genre')
    if genre:
        qs = qs.extra(
            tables=['movie_genres', 'genres'],
            where=[
                'movies.id = movie_genres.movie_id',
                'movie_genres.genre_id = genres.id',
                'genres.slug = %s'
            ],
            params=[genre]
        )

    year_min = request.query_params.get('year_min')
    if year_min:
        qs = qs.filter(year__gte=int(year_min))

    year_max = request.query_params.get('year_max')
    if year_max:
        qs = qs.filter(year__lte=int(year_max))

    content_rating = request.query_params.get('content_rating')
    if content_rating:
        qs = qs.filter(content_rating=content_rating)

    language = request.query_params.get('language')
    if language:
        qs = qs.filter(language__iexact=language)

    # Search
    search = request.query_params.get('search')
    if search:
        qs = qs.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )

    # Ordering
    ordering = request.query_params.get('ordering', '-weighted_rating')
    valid_orderings = {
        'weighted_rating', '-weighted_rating', 'year', '-year', 'title', '-title',
    }
    if ordering in valid_orderings:
        qs = qs.order_by(ordering)
    else:
        qs = qs.order_by('-weighted_rating')

    return paginate_queryset(qs, request, MovieListSerializer)


@api_view(['GET'])
@permission_classes([AllowAny])
def movie_detail(request, pk):
    """GET /api/movies/{id}/ — full detail."""
    try:
        movie = Movie.objects.get(id=pk, is_active=True)
    except Movie.DoesNotExist:
        return api_response(success=False, message='Película no encontrada.', status_code=404)

    data = MovieDetailSerializer(movie).data
    return api_response(data=data)


@api_view(['GET'])
@permission_classes([AllowAny])
def trending(request):
    """GET /api/movies/trending/ — top 20 by weighted_rating."""
    qs = Movie.objects.filter(
        is_active=True, num_ratings__gt=10
    ).order_by('-weighted_rating')[:20]
    
    if not qs:
        qs = Movie.objects.filter(is_active=True).order_by('-weighted_rating')[:20]
        
    data = MovieListSerializer(qs, many=True).data
    return api_response(data=data)


@api_view(['GET'])
@permission_classes([AllowAny])
def new_movies(request):
    """GET /api/movies/new/ — recently added movies."""
    from datetime import timedelta
    from django.utils import timezone as tz
    thirty_days_ago = tz.now() - timedelta(days=30)
    qs = Movie.objects.filter(
        is_active=True, created_at__gte=thirty_days_ago
    ).order_by('-created_at')[:20]

    # If no movies in 30 days, return most recent
    if not qs.exists():
        qs = Movie.objects.filter(is_active=True).order_by('-created_at')[:20]

    data = MovieListSerializer(qs, many=True).data
    return api_response(data=data)


@api_view(['GET'])
@permission_classes([AllowAny])
def originals(request):
    """GET /api/movies/originals/ — StreamFlix originals."""
    qs = Movie.objects.filter(
        is_active=True, is_original=True
    ).order_by('-weighted_rating')[:20]
    data = MovieListSerializer(qs, many=True).data
    return api_response(data=data)


@api_view(['GET'])
@permission_classes([AllowAny])
def by_genre(request, genre_slug):
    """GET /api/movies/by-genre/{genre_slug}/"""
    qs = Movie.objects.filter(is_active=True).extra(
        tables=['movie_genres', 'genres'],
        where=[
            'movies.id = movie_genres.movie_id',
            'movie_genres.genre_id = genres.id',
            'genres.slug = %s'
        ],
        params=[genre_slug]
    ).order_by('-weighted_rating')

    return paginate_queryset(qs, request, MovieListSerializer)


@api_view(['GET'])
@permission_classes([AllowAny])
def similar_movies(request, pk):
    """GET /api/movies/{id}/similar/ — content-based recommendations."""
    try:
        movie = Movie.objects.get(id=pk)
    except Movie.DoesNotExist:
        return api_response(success=False, message='Película no encontrada.', status_code=404)

    data = []
    if movie.movielens_id:
        try:
            from apps.recommendations.recommender import RecommenderService
            service = RecommenderService.get_instance()
            recs = service.get_content_recommendations(movie.movielens_id, n=12)
            movie_ids = [r[0] for r in recs]
            movies = Movie.objects.filter(id__in=movie_ids, is_active=True)
            movies_dict = {m.id: m for m in movies}
            ordered = [movies_dict[mid] for mid in movie_ids if mid in movies_dict]
            data = MovieListSerializer(ordered, many=True).data
        except Exception:
            pass
            
    # Fallback: If SVD/Content logic failed or returned empty, use Genre matching
    if not data:
        from apps.movies.models import MovieGenre
        genre_ids = list(MovieGenre.objects.filter(movie=movie).values_list('genre_id', flat=True))
        if genre_ids:
            # Get movies sharing at least one genre, exclude self
            fallback_qs = Movie.objects.filter(
                is_active=True, 
                id__in=MovieGenre.objects.filter(genre_id__in=genre_ids).values_list('movie_id', flat=True)
            ).exclude(id=movie.id).distinct().order_by('-weighted_rating')[:15]
            data = MovieListSerializer(fallback_qs, many=True).data

    return api_response(data=data)


@api_view(['GET'])
@permission_classes([AllowAny])
def genre_list(request):
    """GET /api/genres/ — all genres."""
    genres = Genre.objects.all().order_by('name')  # ← no is_active filter
    data = GenreSerializer(genres, many=True).data
    return api_response(data=data)
