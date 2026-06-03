"""
Users app views — Auth endpoints and user management.
Auth is 100% manual JWT, no Django auth system.
"""
import uuid
from datetime import datetime, timedelta, timezone

from django.db import connection
from django.db.models import Avg, Count, Sum, F
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, UserSubscription, SubscriptionPlan, PasswordResetToken
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    ProfileUpdateSerializer, SubscriptionPlanSerializer,
    WatchlistAddSerializer, PreferencesUpdateSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)
from .authentication import generate_tokens, decode_refresh_token
from apps.movies.models import Movie, Genre
from apps.movies.serializers import MovieListSerializer
from apps.ratings.models import Rating, WatchHistory
from apps.recommendations.models import UserGenrePreference, UserActorPreference, Recommendation


def api_response(data=None, message='', success=True, status_code=200, errors=None, pagination=None):
    """Standard API response wrapper."""
    body = {
        'success': success,
        'data': data,
        'message': message,
    }
    if errors:
        body['errors'] = errors
    if pagination:
        body['pagination'] = pagination
    return Response(body, status=status_code)


# ─── Auth Endpoints ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(
            success=False, message='Error de validación.',
            errors=serializer.errors, status_code=400
        )

    data = serializer.validated_data

    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        country=data.get('country', ''),
        is_admin=False,
        is_active=True,
    )
    user.set_password(data['password'])
    user.save()

    # Create subscription (Plan Gratuito, id=1)
    UserSubscription.objects.create(
        user=user,
        plan_id=1,
        status='active',
    )

    # Insert genre preferences using raw SQL
    with connection.cursor() as cursor:
        for genre_id in data['favorite_genre_ids']:
            cursor.execute(
                "INSERT INTO user_genre_preferences (user_id, genre_id, weight, source, updated_at) VALUES (%s, %s, 1.0, 'explicit', NOW())",
                [user.id, genre_id]
            )

    # Generate tokens
    access_token, refresh_token = generate_tokens(user)

    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    user.save(update_fields=['last_login'])

    user_data = UserSerializer(user).data

    return api_response(
        data={
            'access': access_token,
            'refresh': refresh_token,
            'user': user_data,
        },
        message='Cuenta creada exitosamente.',
        status_code=201,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(
            success=False, message='Error de validación.',
            errors=serializer.errors, status_code=400
        )

    data = serializer.validated_data

    try:
        user = User.objects.get(email=data['email'])
    except User.DoesNotExist:
        return api_response(
            success=False,
            message='Credenciales incorrectas.',
            status_code=401,
        )

    if not user.verify_password(data['password']):
        return api_response(
            success=False,
            message='Credenciales incorrectas.',
            status_code=401,
        )

    if not user.is_active:
        return api_response(
            success=False,
            message='Tu cuenta ha sido suspendida.',
            status_code=403,
        )

    # Generate tokens
    access_token, refresh_token = generate_tokens(user)

    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    user.save(update_fields=['last_login'])

    user_data = UserSerializer(user).data

    return api_response(
        data={
            'access': access_token,
            'refresh': refresh_token,
            'user': user_data,
        },
        message='Inicio de sesión exitoso.',
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    token = request.data.get('refresh')
    if not token:
        return api_response(
            success=False, message='Refresh token requerido.', status_code=400
        )

    payload = decode_refresh_token(token)
    try:
        user = User.objects.get(id=payload['user_id'])
    except User.DoesNotExist:
        return api_response(
            success=False, message='Usuario no encontrado.', status_code=404
        )

    if not user.is_active:
        return api_response(
            success=False, message='Tu cuenta ha sido suspendida.', status_code=403
        )

    access_token, new_refresh_token = generate_tokens(user)

    return api_response(
        data={'access': access_token, 'refresh': new_refresh_token},
        message='Token renovado.',
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    # With stateless JWT there's no server-side token to invalidate.
    # The frontend removes tokens from localStorage.
    return api_response(message='Sesión cerrada exitosamente.')


# ─── Profile Endpoints ──────────────────────────────────────

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    if request.method == 'GET':
        return api_response(data=UserSerializer(user).data)

    # PUT
    serializer = ProfileUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(
            success=False, message='Error de validación.',
            errors=serializer.errors, status_code=400
        )

    data = serializer.validated_data
    if 'username' in data:
        # Check uniqueness
        if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
            return api_response(
                success=False, message='Nombre de usuario ya en uso.', status_code=400
            )
        user.username = data['username']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'country' in data:
        user.country = data['country']
    if 'language' in data:
        user.language = data['language']

    if 'plan_id' in data:
        new_plan_id = data['plan_id']
        sub = UserSubscription.objects.filter(user=user, status='active').first()
        if sub:
            sub.plan_id = new_plan_id
            sub.save(update_fields=['plan_id'])
        else:
            UserSubscription.objects.create(
                user=user, plan_id=new_plan_id, status='active',
                expires_at=datetime.now(timezone.utc) + timedelta(days=30)
            )

    user.save()
    return api_response(data=UserSerializer(user).data, message='Perfil actualizado.')


# ─── Password Reset ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists
        return api_response(message='Si el email existe, recibirás instrucciones de recuperación.')

    token = str(uuid.uuid4())
    PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    # Simulated email send
    return api_response(
        data={'token': token},  # In production, this would be sent via email
        message='Si el email existe, recibirás instrucciones de recuperación.',
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    data = serializer.validated_data

    try:
        reset_token = PasswordResetToken.objects.get(
            token=data['token'],
            used=False,
        )
    except PasswordResetToken.DoesNotExist:
        return api_response(success=False, message='Token inválido.', status_code=400)

    if reset_token.expires_at < datetime.now(timezone.utc):
        return api_response(success=False, message='Token expirado.', status_code=400)

    user = reset_token.user
    user.set_password(data['new_password'])
    user.save(update_fields=['password_hash'])

    reset_token.used = True
    reset_token.save(update_fields=['used'])

    return api_response(message='Contraseña actualizada exitosamente.')


# ─── Watchlist ───────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def watchlist(request, user_id):
    if request.user.id != user_id:
        return api_response(success=False, message='No autorizado.', status_code=403)

    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT m.id FROM user_watchlist uw
                JOIN movies m ON uw.movie_id = m.id
                WHERE uw.user_id = %s AND m.is_active = TRUE
                ORDER BY uw.added_at DESC
            """, [user_id])
            movie_ids = [row[0] for row in cursor.fetchall()]

        movies = Movie.objects.filter(id__in=movie_ids)
        # Preserve order
        movies_dict = {m.id: m for m in movies}
        ordered = [movies_dict[mid] for mid in movie_ids if mid in movies_dict]
        data = MovieListSerializer(ordered, many=True).data
        return api_response(data=data)

    # POST
    serializer = WatchlistAddSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    movie_id = serializer.validated_data['movie_id']

    # Check if already in watchlist
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM user_watchlist WHERE user_id = %s AND movie_id = %s",
            [user_id, movie_id]
        )
        if cursor.fetchone():
            return api_response(message='Ya está en tu lista.')

        cursor.execute(
            "INSERT INTO user_watchlist (user_id, movie_id, added_at) VALUES (%s, %s, NOW())",
            [user_id, movie_id]
        )

    # Fix #2: Invalidate recommendation cache so Para Ti page refreshes
    # The user expressed interest → the AI must re-evaluate
    Recommendation.objects.filter(user_id=user_id).delete()

    return api_response(message='Agregado a tu lista.', status_code=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def watchlist_remove(request, user_id, movie_id):
    if request.user.id != user_id:
        return api_response(success=False, message='No autorizado.', status_code=403)

    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM user_watchlist WHERE user_id = %s AND movie_id = %s",
            [user_id, movie_id]
        )

    return api_response(message='Eliminado de tu lista.')


# ─── History ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def history(request, user_id):
    if request.user.id != user_id:
        return api_response(success=False, message='No autorizado.', status_code=403)

    entries = WatchHistory.objects.filter(
        user_id=user_id
    ).select_related('movie').order_by('-watched_at')[:50]

    from apps.ratings.serializers import WatchHistorySerializer
    data = WatchHistorySerializer(entries, many=True).data
    return api_response(data=data)


# ─── Preferences ─────────────────────────────────────────────

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def preferences(request, user_id):
    if request.user.id != user_id:
        return api_response(success=False, message='No autorizado.', status_code=403)

    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, g.name, ugp.weight
                FROM user_genre_preferences ugp
                JOIN genres g ON ugp.genre_id = g.id
                WHERE ugp.user_id = %s
            """, [user_id])
            genres_data = [{'id': r[0], 'name': r[1], 'weight': float(r[2])} for r in cursor.fetchall()]

            cursor.execute("""
                SELECT p.id, p.full_name, uap.weight
                FROM user_actor_preferences uap
                JOIN people p ON uap.person_id = p.id
                WHERE uap.user_id = %s
            """, [user_id])
            actors_data = [{'id': r[0], 'name': r[1], 'weight': float(r[2])} for r in cursor.fetchall()]

        data = {
            'genres': genres_data,
            'actors': actors_data,
        }
        return api_response(data=data)

    # PUT
    serializer = PreferencesUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return api_response(success=False, errors=serializer.errors, status_code=400)

    genre_ids = serializer.validated_data['genre_ids']

    # Delete old and insert new
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM user_genre_preferences WHERE user_id = %s", [user_id])
        for gid in genre_ids:
            cursor.execute(
                "INSERT INTO user_genre_preferences (user_id, genre_id, weight, source, updated_at) VALUES (%s, %s, 1.0, 'explicit', NOW())",
                [user_id, gid]
            )

    return api_response(message='Preferencias actualizadas.')


# ─── User Stats ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request, user_id):
    if request.user.id != user_id:
        return api_response(success=False, message='No autorizado.', status_code=403)

    total_watched = WatchHistory.objects.filter(user_id=user_id, completed=True).count()
    avg_rating = Rating.objects.filter(user_id=user_id).aggregate(avg=Avg('rating'))['avg']

    # Total hours (sum of movie durations for completed watches)
    total_minutes = WatchHistory.objects.filter(
        user_id=user_id, completed=True
    ).select_related('movie').aggregate(
        total=Sum('movie__duration_min')
    )['total'] or 0

    # Favorite genre
    favorite_genre = None
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT g.name, COUNT(*) as cnt
            FROM watch_history wh
            JOIN movie_genres mg ON wh.movie_id = mg.movie_id
            JOIN genres g ON mg.genre_id = g.id
            WHERE wh.user_id = %s AND wh.completed = TRUE
            GROUP BY g.name
            ORDER BY cnt DESC
            LIMIT 1
        """, [user_id])
        row = cursor.fetchone()
        if row:
            favorite_genre = row[0]

    # Calculate AI Weights
    ai_weights = []
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT g.name, SUM(
                CASE
                    WHEN source_type = 'rating' THEN COALESCE(score, 3.0)
                    WHEN source_type = 'watchlist' THEN 4.0
                    WHEN source_type = 'history' THEN 3.5
                    ELSE 3.0
                END
            ) AS genre_score
            FROM (
                SELECT movie_id, rating AS score, 'rating' AS source_type FROM ratings WHERE user_id = %s
                UNION ALL
                SELECT movie_id, 4.0 AS score, 'watchlist' AS source_type FROM user_watchlist WHERE user_id = %s
                UNION ALL
                SELECT movie_id, 3.5 AS score, 'history' AS source_type FROM watch_history WHERE user_id = %s
            ) as combined_signals
            JOIN movie_genres mg ON combined_signals.movie_id = mg.movie_id
            JOIN genres g ON mg.genre_id = g.id
            GROUP BY g.name
            ORDER BY genre_score DESC
            LIMIT 6
        """, [user_id, user_id, user_id])
        ai_weights = [{'name': row[0], 'points': round(float(row[1]), 1)} for row in cursor.fetchall()]

    data = {
        'total_watched': total_watched,
        'avg_rating_given': round(float(avg_rating), 2) if avg_rating else 0,
        'total_hours': round(total_minutes / 60, 1),
        'favorite_genre': favorite_genre,
        'ai_weights': ai_weights,
    }

    return api_response(data=data)
