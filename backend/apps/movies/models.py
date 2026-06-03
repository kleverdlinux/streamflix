from django.db import models


class Genre(models.Model):
    """Maps to genres table."""
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
    # ← NO icon, NO is_active (no existen en el schema real)

    class Meta:
        managed = False
        db_table = 'genres'

    def __str__(self):
        return self.name


class Person(models.Model):
    """Maps to people table."""
    full_name = models.CharField(max_length=200)   # ← full_name (no 'name')
    slug = models.SlugField(max_length=200, unique=True)
    birth_date = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=80, blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)  # ← bio (no 'biography')

    class Meta:
        managed = False
        db_table = 'people'

    def __str__(self):
        return self.full_name


class Movie(models.Model):
    """Maps to movies table."""
    movielens_id = models.IntegerField(blank=True, null=True, unique=True)
    title = models.CharField(max_length=300)
    title_original = models.CharField(max_length=300, blank=True, null=True)  # ← columna real
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField(blank=True, null=True)
    year = models.SmallIntegerField(blank=True, null=True)
    duration_min = models.SmallIntegerField(blank=True, null=True)
    content_rating = models.CharField(max_length=10, blank=True, null=True)
    language = models.CharField(max_length=30, blank=True, null=True)
    country = models.CharField(max_length=80, blank=True, null=True)
    poster_url = models.URLField(max_length=500, blank=True, null=True)
    backdrop_url = models.URLField(max_length=500, blank=True, null=True)
    trailer_youtube_id = models.CharField(max_length=50, blank=True, null=True)
    imdb_rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)  # ← columna real
    weighted_rating = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    avg_rating = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    num_ratings = models.IntegerField(default=0)
    is_original = models.BooleanField(default=False)
    award_winner = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    min_plan = models.ForeignKey(
        'users.SubscriptionPlan',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='min_plan_id'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'movies'

    def __str__(self):
        return f"{self.title} ({self.year})"


class MovieGenre(models.Model):
    """Maps to movie_genres table."""
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, db_column='movie_id')
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, db_column='genre_id')
    is_primary = models.BooleanField(default=False)  # ← columna real

    class Meta:
        managed = False
        db_table = 'movie_genres'
        unique_together = ('movie', 'genre')


class MoviePerson(models.Model):
    """Maps to movie_people table."""
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, db_column='movie_id')
    person = models.ForeignKey(Person, on_delete=models.CASCADE, db_column='person_id')
    role = models.CharField(max_length=20)               # director, actor, producer, writer
    character = models.CharField(max_length=200, blank=True, null=True)  # ← 'character' (no character_name)
    billing = models.SmallIntegerField(blank=True, null=True)            # ← 'billing' (no display_order)

    class Meta:
        managed = False
        db_table = 'movie_people'
        unique_together = ('movie', 'person', 'role')
