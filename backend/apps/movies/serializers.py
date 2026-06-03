from django.db import connection
from rest_framework import serializers
from .models import Genre, Movie, Person, MovieGenre, MoviePerson


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']  # ← removed icon, is_active (don't exist)


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'full_name', 'photo_url', 'bio', 'birth_date', 'nationality', 'slug']
        # ← full_name (not name), bio (not biography)


class MoviePersonSerializer(serializers.ModelSerializer):
    person = PersonSerializer(read_only=True)

    class Meta:
        model = MoviePerson
        fields = ['person', 'role', 'character', 'billing']  # ← character (not character_name), billing (not display_order)


class MovieListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lists and grids."""
    genres = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = ['id', 'movielens_id', 'title', 'slug', 'poster_url', 'year',
                  'duration_min', 'content_rating', 'weighted_rating',
                  'avg_rating', 'num_ratings', 'genres', 'is_original',
                  'trailer_youtube_id', 'min_plan_id', 'language']

    def get_genres(self, obj):
        if not hasattr(self, 'context') or self.context is None:
            self.context = {}
        if 'genres_cache' not in self.context:
            cache = {}
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT mg.movie_id, g.id, g.name, g.slug
                    FROM movie_genres mg
                    JOIN genres g ON mg.genre_id = g.id
                """)
                for row in cursor.fetchall():
                    movie_id, genre_id, name, slug = row
                    if movie_id not in cache:
                        cache[movie_id] = []
                    cache[movie_id].append({'id': genre_id, 'name': name, 'slug': slug})
            self.context['genres_cache'] = cache

        return self.context['genres_cache'].get(obj.id, [])


class MovieDetailSerializer(serializers.ModelSerializer):
    """Full serializer for movie detail page."""
    genres = serializers.SerializerMethodField()
    people = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = ['id', 'movielens_id', 'title', 'title_original', 'slug', 'description',
                  'year', 'duration_min', 'content_rating', 'language',
                  'country', 'poster_url', 'backdrop_url', 'trailer_youtube_id',
                  'imdb_rating', 'weighted_rating', 'avg_rating', 'num_ratings',
                  'is_original', 'is_active', 'award_winner',
                  'min_plan_id', 'created_at', 'genres', 'people']

    def get_genres(self, obj):
        genres = Genre.objects.raw("""
            SELECT g.id, g.name, g.slug 
            FROM genres g
            JOIN movie_genres mg ON g.id = mg.genre_id
            WHERE mg.movie_id = %s
        """, [obj.id])
        return [{'id': g.id, 'name': g.name, 'slug': g.slug} for g in genres]

    def get_people(self, obj):
        people = Person.objects.raw("""
            SELECT p.id, p.full_name, p.photo_url, mp.character, mp.role 
            FROM people p
            JOIN movie_people mp ON p.id = mp.person_id
            WHERE mp.movie_id = %s
            ORDER BY mp.role, mp.billing
        """, [obj.id])
        
        result = {'actors': [], 'directors': [], 'writers': []}
        for p in people:
            entry = {
                'id': p.id,
                'name': p.full_name,
                'photo_url': p.photo_url,
                'character_name': p.character,
            }
            role_key = p.role + 's' if p.role in ('actor', 'director', 'writer') else 'actors'
            if role_key in result:
                result[role_key].append(entry)
        return result


class MovieCreateUpdateSerializer(serializers.ModelSerializer):
    genre_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Movie
        fields = ['title', 'slug', 'description', 'year', 'duration_min',
                  'content_rating', 'language', 'country', 'poster_url',
                  'backdrop_url', 'trailer_youtube_id', 'is_original',
                  'award_winner', 'min_plan_id', 'genre_ids']
        extra_kwargs = {'slug': {'required': False}}
