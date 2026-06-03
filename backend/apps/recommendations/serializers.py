from rest_framework import serializers
from .models import Recommendation
from apps.movies.serializers import MovieListSerializer


class RecommendationSerializer(serializers.ModelSerializer):
    movie = MovieListSerializer(read_only=True)

    class Meta:
        model = Recommendation
        fields = ['id', 'movie', 'score', 'rank', 'model_version', 'expires_at', 'generated_at']


class MatchScoreSerializer(serializers.Serializer):
    movie_id = serializers.IntegerField()
    probability = serializers.FloatField()
    will_like = serializers.BooleanField()
