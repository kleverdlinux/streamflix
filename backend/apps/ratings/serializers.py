from rest_framework import serializers
from .models import Rating, WatchHistory
from apps.movies.serializers import MovieListSerializer


class RatingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar_url = serializers.CharField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user_id', 'movie_id', 'rating', 'liked', 'review',
                  'created_at', 'updated_at', 'username', 'avatar_url']


class RateMovieSerializer(serializers.Serializer):
    rating = serializers.DecimalField(max_digits=2, decimal_places=1, min_value=1.0, max_value=5.0)
    liked = serializers.BooleanField(required=False, default=None, allow_null=True)
    review = serializers.CharField(required=False, allow_blank=True, default='')


class WatchHistorySerializer(serializers.ModelSerializer):
    movie = MovieListSerializer(read_only=True)

    class Meta:
        model = WatchHistory
        fields = ['id', 'movie', 'progress_pct', 'completed', 'device_type', 'watched_at']


class WatchSerializer(serializers.Serializer):
    progress_pct = serializers.IntegerField(min_value=0, max_value=100, default=0)
    completed = serializers.BooleanField(default=False)
    device_type = serializers.ChoiceField(
        choices=['web', 'mobile', 'tv', 'tablet'], default='web'
    )
