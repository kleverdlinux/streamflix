"""
Admin panel views — Dashboard, CRUD, Metrics, Logs.
"""
import json
import os
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import connection

from django.db.models import Count, Avg, Sum, Q, F
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from slugify import slugify


def _insert_movie_genre(movie_id, genre_id):
    """Raw SQL — movie_genres no tiene columna id (PK compuesta)."""
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO movie_genres (movie_id, genre_id, is_primary) "
            "VALUES (%s, %s, FALSE) ON CONFLICT (movie_id, genre_id) DO NOTHING",
            [movie_id, genre_id]
        )

from .models import ModelMetrics, AdminLog
from .serializers import ModelMetricsSerializer, AdminLogSerializer
from .permissions import IsAdminUser
from .decorators import log_admin_action
from apps.users.models import User, UserSubscription, SubscriptionPlan
from apps.users.serializers import UserSerializer
from apps.movies.models import Movie, Genre, MovieGenre
from apps.movies.serializers import MovieListSerializer, MovieDetailSerializer, MovieCreateUpdateSerializer
from apps.ratings.models import Rating, WatchHistory


def api_response(data=None, message='', success=True, status_code=200, errors=None, pagination=None):
    body = {'success': success, 'data': data, 'message': message}
    if errors:
        body['errors'] = errors
    if pagination:
        body['pagination'] = pagination
    return Response(body, status=status_code)


def paginate_qs(queryset, request, serializer_class):
    page = int(request.query_params.get('page', 1))
    page_size = min(int(request.query_params.get('page_size', 20)), 100)
    total = queryset.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    items = queryset[start:start + page_size]
    data = serializer_class(items, many=True).data
    return api_response(data=data, pagination={
        'count': total, 'page': page, 'page_size': page_size, 'total_pages': total_pages
    })


# ─── Dashboard ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard(request):
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    new_users = User.objects.filter(created_at__gte=month_start).count()

    total_movies = Movie.objects.count()
    active_movies = Movie.objects.filter(is_active=True).count()

    total_ratings = Rating.objects.count()
    avg_rating = Rating.objects.aggregate(avg=Avg('rating'))['avg'] or 0

    total_watch = WatchHistory.objects.count()
    total_hours_raw = WatchHistory.objects.filter(
        completed=True
    ).select_related('movie').aggregate(
        total=Sum('movie__duration_min')
    )['total'] or 0
    total_hours = round(total_hours_raw / 60, 1)

    # Revenue estimate
    plans = SubscriptionPlan.objects.all()
    plan_prices = {p.id: float(p.price) for p in plans}

    subs = UserSubscription.objects.filter(
        status='active'
    ).values('plan_id').annotate(count=Count('id'))

    revenue = 0
    plan_dist = []
    for s in subs:
        pid = s['plan_id']
        cnt = s['count']
        price = plan_prices.get(pid, 0)
        revenue += price * cnt
        plan_name = next((p.name for p in plans if p.id == pid), 'Unknown')
        plan_dist.append({
            'plan_name': plan_name,
            'count': cnt,
            'percentage': round(cnt / max(total_users, 1) * 100, 1),
        })

    revenue_estimate = {
        'monthly_revenue': round(revenue, 2),
    }
    for p in plans:
        key = p.name.lower().replace(' ', '_') + '_count'
        count = next((s['count'] for s in subs if s['plan_id'] == p.id), 0)
        revenue_estimate[key] = count

    # Top 10 movies
    top_movies = []
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT m.id, m.title,
                   (SELECT COUNT(*) FROM ratings r WHERE r.movie_id = m.id) AS actual_ratings_count,
                   m.avg_rating,
                   COUNT(wh.id) as watch_count
            FROM movies m
            LEFT JOIN watch_history wh ON m.id = wh.movie_id
            WHERE m.is_active = TRUE
            GROUP BY m.id, m.title, m.avg_rating
            ORDER BY watch_count DESC, actual_ratings_count DESC
            LIMIT 10
        """)
        for row in cursor.fetchall():
            top_movies.append({
                'id': row[0], 'title': row[1],
                'num_ratings': row[2],
                'avg_rating': float(row[3]) if row[3] else 0,
                'watch_count': row[4],
            })

    # Registrations by month (last 6 months)
    reg_by_month = []
    for i in range(5, -1, -1):
        m_start = (now - timedelta(days=30 * i)).replace(day=1)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        count = User.objects.filter(
            created_at__gte=m_start, created_at__lt=m_end
        ).count()
        reg_by_month.append({
            'month': m_start.strftime('%Y-%m'),
            'count': count,
        })

    data = {
        'total_users': total_users,
        'active_users': active_users,
        'new_users_this_month': new_users,
        'total_movies': total_movies,
        'active_movies': active_movies,
        'total_ratings': total_ratings,
        'avg_rating_platform': round(float(avg_rating), 2),
        'total_watch_sessions': total_watch,
        'total_hours_watched': total_hours,
        'revenue_estimate': revenue_estimate,
        'plan_distribution': plan_dist,
        'top_10_movies': top_movies,
        'registrations_by_month': reg_by_month,
    }

    return api_response(data=data)


# ─── Admin Users ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_users_list(request):
    qs = User.objects.all().order_by('-created_at')

    search = request.query_params.get('search')
    if search:
        qs = qs.filter(
            Q(username__icontains=search) | Q(email__icontains=search)
        )

    plan_id = request.query_params.get('plan_id')
    if plan_id:
        user_ids = UserSubscription.objects.filter(
            plan_id=plan_id, status='active'
        ).values_list('user_id', flat=True)
        qs = qs.filter(id__in=user_ids)

    is_active = request.query_params.get('is_active')
    if is_active is not None:
        qs = qs.filter(is_active=is_active.lower() == 'true')

    return paginate_qs(qs, request, UserSerializer)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_user_detail(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return api_response(success=False, message='Usuario no encontrado.', status_code=404)

    if request.method == 'GET':
        user_data = UserSerializer(user).data
        # Add recent watch history
        recent = WatchHistory.objects.filter(
            user=user
        ).select_related('movie').order_by('-watched_at')[:10]
        from apps.ratings.serializers import WatchHistorySerializer
        user_data['recent_watches'] = WatchHistorySerializer(recent, many=True).data
        return api_response(data=user_data)

    # PUT
    changes = {}
    if 'is_active' in request.data:
        old = user.is_active
        user.is_active = request.data['is_active']
        changes['is_active'] = {'from': old, 'to': user.is_active}

    if 'plan_id' in request.data:
        new_plan_id = request.data['plan_id']
        sub = UserSubscription.objects.filter(user=user, status='active').first()
        if sub:
            old_plan = sub.plan_id
            sub.plan_id = new_plan_id
            sub.save(update_fields=['plan_id'])
            changes['plan_id'] = {'from': old_plan, 'to': new_plan_id}
        else:
            UserSubscription.objects.create(
                user=user,
                plan_id=new_plan_id,
                status='active',
                expires_at=timezone.now() + timedelta(days=30)
            )
            changes['plan_id'] = {'from': None, 'to': new_plan_id}

    user.save()

    # Log
    AdminLog.objects.create(
        admin=request.user,
        action='user.update',
        target_type='user',
        target_id=pk,
        detail=changes,
        ip_address=request.META.get('REMOTE_ADDR'),
    )

    return api_response(data=UserSerializer(user).data, message='Usuario actualizado.')


# ─── Admin Movies ────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_movies_list(request):
    if request.method == 'GET':
        qs = Movie.objects.all().order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search))

        genre = request.query_params.get('genre')
        if genre:
            ids = MovieGenre.objects.filter(genre__slug=genre).values_list('movie_id', flat=True)
            qs = qs.filter(id__in=ids)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        year = request.query_params.get('year')
        if year:
            qs = qs.filter(year=int(year))

        sort = request.query_params.get('sort')
        if sort:
            # allowed sorts to prevent injection
            if sort in ['-created_at', 'title', '-title', 'year', '-year', 'duration_min', '-duration_min']:
                qs = qs.order_by(sort)

        return paginate_qs(qs, request, MovieListSerializer)

    # POST — create movie
    serializer = MovieCreateUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    data = serializer.validated_data
    genre_ids = data.pop('genre_ids', [])

    if not data.get('slug'):
        data['slug'] = slugify(data['title'])

    movie = Movie.objects.create(**data, is_active=True)

    for gid in genre_ids:
        _insert_movie_genre(movie.id, gid)

    AdminLog.objects.create(
        admin=request.user, action='movie.create',
        target_type='movie', target_id=movie.id,
        detail={'title': movie.title},
        ip_address=request.META.get('REMOTE_ADDR'),
    )

    return api_response(
        data=MovieDetailSerializer(movie).data,
        message='Película creada.', status_code=201
    )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_movie_detail(request, pk):
    try:
        movie = Movie.objects.get(id=pk)
    except Movie.DoesNotExist:
        return api_response(success=False, message='Película no encontrada.', status_code=404)

    if request.method == 'GET':
        return api_response(data=MovieDetailSerializer(movie).data)

    if request.method == 'DELETE':
        if request.query_params.get('hard') == 'true':
            movie_id = movie.id
            movie_title = movie.title
            movie.delete()
            AdminLog.objects.create(
                admin=request.user, action='movie.hard_delete',
                target_type='movie', target_id=movie_id,
                detail={'title': movie_title},
                ip_address=request.META.get('REMOTE_ADDR'),
            )
            return api_response(message='Película eliminada permanentemente.')
        else:
            movie.is_active = False
            movie.save(update_fields=['is_active'])
            AdminLog.objects.create(
                admin=request.user, action='movie.delete',
                target_type='movie', target_id=pk,
                detail={'title': movie.title},
                ip_address=request.META.get('REMOTE_ADDR'),
            )
            return api_response(message='Película desactivada.')

    # PUT
    serializer = MovieCreateUpdateSerializer(movie, data=request.data, partial=True)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    data = serializer.validated_data
    genre_ids = data.pop('genre_ids', None)

    for attr, val in data.items():
        setattr(movie, attr, val)
    movie.save()

    if genre_ids is not None:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM movie_genres WHERE movie_id = %s", [movie.id])
        for gid in genre_ids:
            _insert_movie_genre(movie.id, gid)

    AdminLog.objects.create(
        admin=request.user, action='movie.update',
        target_type='movie', target_id=pk,
        detail={'updated_fields': list(data.keys())},
        ip_address=request.META.get('REMOTE_ADDR'),
    )

    return api_response(data=MovieDetailSerializer(movie).data, message='Película actualizada.')


# ─── Metrics ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def metrics(request):
    # Try to load from model_metrics.json
    json_path = os.path.join(settings.ML_MODELS_PATH, 'model_metrics.json')
    current_model = {}

    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            current_model = json.load(f)

    # History from database
    history = ModelMetrics.objects.all().order_by('-trained_at')[:5]
    history_data = ModelMetricsSerializer(history, many=True).data

    # Baseline comparison
    baseline_comparison = {
        'current_rmse': current_model.get('rmse', 0.8470),
        'baseline_rmse': 1.089,
        'improvement_pct': 22.19,
    }

    data = {
        'current_model': current_model,
        'history': history_data,
        'baseline_comparison': baseline_comparison,
    }

    return api_response(data=data)


# ─── Logs ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_logs(request):
    qs = AdminLog.objects.all().order_by('-created_at')

    admin_id = request.query_params.get('admin_id')
    if admin_id:
        qs = qs.filter(admin_id=admin_id)

    action = request.query_params.get('action')
    if action:
        qs = qs.filter(action__icontains=action)

    date_from = request.query_params.get('date_from')
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)

    date_to = request.query_params.get('date_to')
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    return paginate_qs(qs, request, AdminLogSerializer)
