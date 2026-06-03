from rest_framework import serializers
from .models import User, SubscriptionPlan, UserSubscription, PasswordResetToken
from apps.recommendations.models import UserGenrePreference
from apps.movies.models import Genre


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price_monthly', 'max_devices', 'max_quality',
                  'has_ads', 'has_downloads', 'ai_priority', 'description', 'is_active']
        # ← price_monthly, max_devices, has_downloads, ai_priority (nombres reales)


class GenreMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']


class UserSerializer(serializers.ModelSerializer):
    plan_name = serializers.SerializerMethodField()
    plan_id = serializers.SerializerMethodField()
    favorite_genres = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar_url', 'country',
                  'language', 'is_active', 'is_admin', 'created_at',
                  'last_login', 'plan_name', 'plan_id', 'favorite_genres']

    def get_plan_name(self, obj):
        sub = UserSubscription.objects.filter(
            user=obj, status='active'
        ).select_related('plan').first()
        return sub.plan.name if sub else 'Gratuito'

    def get_plan_id(self, obj):
        sub = UserSubscription.objects.filter(
            user=obj, status='active'
        ).select_related('plan').first()
        return sub.plan.id if sub else 1

    def get_favorite_genres(self, obj):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, g.name, g.slug 
                FROM user_genre_preferences ugp
                JOIN genres g ON ugp.genre_id = g.id
                WHERE ugp.user_id = %s
            """, [obj.id])
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)
    country = serializers.CharField(max_length=60, required=False, default='')
    favorite_genre_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=3
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('El nombre de usuario ya está en uso.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('El email ya está registrado.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden.'})
        valid_genres = Genre.objects.filter(id__in=data['favorite_genre_ids']).count()
        if valid_genres < 3:
            raise serializers.ValidationError({'favorite_genre_ids': 'Selecciona al menos 3 géneros válidos.'})
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, required=False)
    avatar_url = serializers.URLField(required=False, allow_blank=True)
    country = serializers.CharField(max_length=60, required=False, allow_blank=True)
    language = serializers.CharField(max_length=10, required=False)
    plan_id = serializers.IntegerField(required=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6)
    confirm_password = serializers.CharField(min_length=6)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden.'})
        return data


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'status', 'started_at', 'expires_at',
                  'cancelled_at', 'payment_ref', 'auto_renew']


class WatchlistAddSerializer(serializers.Serializer):
    movie_id = serializers.IntegerField()


class PreferencesUpdateSerializer(serializers.Serializer):
    genre_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )
