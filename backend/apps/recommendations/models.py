from django.db import models


class Recommendation(models.Model):
    """Maps to recommendations table."""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE, db_column='movie_id')
    score = models.DecimalField(max_digits=8, decimal_places=6)
    rank = models.SmallIntegerField()
    model_version = models.CharField(max_length=20, default='1.0')  # ← model_version (no recommendation_type)
    generated_at = models.DateTimeField(auto_now_add=True)           # ← generated_at (no created_at)
    expires_at = models.DateTimeField(blank=True, null=True)
    # ← NO recommendation_type (no existe en el schema)

    class Meta:
        managed = False
        db_table = 'recommendations'
        unique_together = ('user', 'movie')


class UserGenrePreference(models.Model):
    """Maps to user_genre_preferences table."""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    genre = models.ForeignKey('movies.Genre', on_delete=models.CASCADE, db_column='genre_id')
    weight = models.DecimalField(max_digits=4, decimal_places=3, default=1.000)
    source = models.CharField(max_length=20, default='explicit')  # explicit, implicit
    updated_at = models.DateTimeField(auto_now=True)              # ← updated_at (no created_at)

    class Meta:
        managed = False
        db_table = 'user_genre_preferences'
        unique_together = ('user', 'genre')


class UserActorPreference(models.Model):
    """Maps to user_actor_preferences table."""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    person = models.ForeignKey('movies.Person', on_delete=models.CASCADE, db_column='person_id')
    weight = models.DecimalField(max_digits=4, decimal_places=3, default=1.000)
    updated_at = models.DateTimeField(auto_now=True)              # ← solo updated_at (no created_at)

    class Meta:
        managed = False
        db_table = 'user_actor_preferences'
        unique_together = ('user', 'person')
