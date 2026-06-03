from rest_framework import serializers
from .models import ModelMetrics, AdminLog
from apps.users.serializers import UserSerializer
from apps.movies.serializers import MovieListSerializer


class ModelMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelMetrics
        fields = '__all__'


class AdminLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)

    class Meta:
        model = AdminLog
        fields = ['id', 'admin_id', 'admin_username', 'action', 'target_type',
                  'target_id', 'detail', 'ip_address', 'created_at']


class DashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    total_movies = serializers.IntegerField()
    active_movies = serializers.IntegerField()
    total_ratings = serializers.IntegerField()
    avg_rating_platform = serializers.FloatField()
    total_watch_sessions = serializers.IntegerField()
    total_hours_watched = serializers.FloatField()
    revenue_estimate = serializers.DictField()
    plan_distribution = serializers.ListField()
    top_10_movies = serializers.ListField()
    registrations_by_month = serializers.ListField()
