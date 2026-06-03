"""
Custom JWT Authentication for StreamFlix.
Uses our custom User model (not AbstractBaseUser) with SimpleJWT token generation.
"""
import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework import authentication, exceptions
from apps.users.models import User


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication class.
    Reads the Bearer token from the Authorization header,
    decodes it, and returns the User from our custom users table.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None  # No token → anonymous request, let permissions decide

        try:
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            return None

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token expirado.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Token inválido.')

        # Check token type
        if payload.get('token_type') != 'access':
            return None

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return None

        if not user.is_active:
            return None

        return (user, token)


def generate_tokens(user):
    """Generate access and refresh tokens for a user."""
    now = datetime.now(timezone.utc)

    access_payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'token_type': 'access',
        'iat': now,
        'exp': now + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
    }

    refresh_payload = {
        'user_id': user.id,
        'token_type': 'refresh',
        'iat': now,
        'exp': now + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
    }

    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm=settings.SIMPLE_JWT['ALGORITHM'])
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=settings.SIMPLE_JWT['ALGORITHM'])

    return access_token, refresh_token


def decode_refresh_token(token):
    """Decode and validate a refresh token, returning the payload."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
        )
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Refresh token expirado.')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Refresh token inválido.')

    if payload.get('token_type') != 'refresh':
        raise exceptions.AuthenticationFailed('Tipo de token inválido.')

    return payload
