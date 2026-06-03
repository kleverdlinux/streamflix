from django.db import models


class Rating(models.Model):
    """Maps to ratings table."""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE, db_column='movie_id')
    rating = models.DecimalField(max_digits=2, decimal_places=1)
    liked = models.BooleanField(blank=True, null=True)
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'ratings'
        unique_together = ('user', 'movie')


class WatchHistory(models.Model):
    """Maps to watch_history table."""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE, db_column='movie_id')
    progress_pct = models.SmallIntegerField(default=0)
    completed = models.BooleanField(default=False)
    device_type = models.CharField(max_length=20, default='web')
    watched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'watch_history'
