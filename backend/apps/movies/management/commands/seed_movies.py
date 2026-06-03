"""
Management command to seed movies from movies_metadata.csv.
Maps CSV columns to the movies table and creates movie_genres relationships.

NOTA: movie_genres usa PRIMARY KEY compuesta (movie_id, genre_id) — sin columna id.
      Por eso se usa SQL directo para INSERT en esa tabla.
"""
import csv
import os
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from slugify import slugify
from apps.movies.models import Movie, Genre


def _insert_movie_genre(movie_id, genre_id):
    """Raw SQL insert into movie_genres (composite PK, no id column)."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO movie_genres (movie_id, genre_id, is_primary)
            VALUES (%s, %s, FALSE)
            ON CONFLICT (movie_id, genre_id) DO NOTHING
            """,
            [movie_id, genre_id]
        )


def _genre_exists(movie_id, genre_id):
    """Check if movie-genre relationship already exists."""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM movie_genres WHERE movie_id = %s AND genre_id = %s",
            [movie_id, genre_id]
        )
        return cursor.fetchone() is not None


class Command(BaseCommand):
    help = 'Seed movies from ml_models/movies_metadata.csv into the movies table'

    def handle(self, *args, **options):
        csv_path = os.path.join(settings.ML_MODELS_PATH, 'movies_metadata.csv')

        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f'CSV file not found: {csv_path}'))
            return

        # Preload genres for fast lookup
        genre_cache = {g.name.lower(): g for g in Genre.objects.all()}
        self.stdout.write(f'Genres preloaded: {len(genre_cache)}')

        # Read CSV
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            created_count = 0
            skipped_count = 0

            for row in reader:
                movielens_id_raw = row.get('MovieID', '0')
                try:
                    movielens_id = int(movielens_id_raw)
                except (ValueError, TypeError):
                    continue

                # Skip if already exists
                if Movie.objects.filter(movielens_id=movielens_id).exists():
                    skipped_count += 1
                    continue

                title = row.get('Title_Clean') or row.get('Title') or 'Unknown'
                slug = slugify(title) or f'movie-{movielens_id}'

                # Ensure slug uniqueness
                base_slug = slug
                counter = 1
                while Movie.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                def safe_decimal(val, default='0'):
                    try:
                        return Decimal(str(val).strip()) if val else Decimal(default)
                    except (InvalidOperation, ValueError):
                        return Decimal(default)

                def safe_int(val, default=0):
                    try:
                        return int(float(str(val).strip())) if val else default
                    except (ValueError, TypeError):
                        return default

                def safe_bool(val):
                    if isinstance(val, bool):
                        return val
                    if isinstance(val, str):
                        return val.strip().lower() in ('true', '1', 'yes', 'si')
                    return False

                movie = Movie(
                    movielens_id=movielens_id,
                    title=title,
                    slug=slug,
                    year=safe_int(row.get('Year')) or None,
                    duration_min=safe_int(row.get('Duration_Min')) or None,
                    language=row.get('Language') or 'English',
                    country=row.get('Country') or 'USA',
                    content_rating=row.get('Content_Rating') or None,
                    weighted_rating=safe_decimal(row.get('Weighted_Rating', '0')),
                    avg_rating=safe_decimal(row.get('Avg_Rating', '0')),
                    num_ratings=safe_int(row.get('Num_Ratings', 0)),
                    is_original=safe_bool(row.get('Is_Original')),
                    award_winner=safe_bool(row.get('Award_Winner')),
                    trailer_youtube_id=row.get('Trailer_YT_ID') or None,
                    poster_url=row.get('Poster_URL') or None,
                    backdrop_url=row.get('Backdrop_URL') or None,
                    description=row.get('Description') or None,
                    is_active=True,
                    min_plan_id=safe_int(row.get('Min_Plan_ID', 1)) or 1,
                )
                movie.save()

                # Process genres (pipe-separated)
                genres_str = row.get('Genres', '')
                if genres_str:
                    for genre_name in genres_str.split('|'):
                        genre_name = genre_name.strip()
                        if not genre_name:
                            continue

                        genre_key = genre_name.lower()
                        if genre_key not in genre_cache:
                            # Genre tabla no tiene is_active → solo name y slug
                            genre = Genre(
                                name=genre_name,
                                slug=slugify(genre_name) or genre_name.lower().replace(' ', '-'),
                            )
                            genre.save()
                            genre_cache[genre_key] = genre

                        genre = genre_cache[genre_key]

                        # INSERT con SQL directo — movie_genres no tiene columna id
                        if not _genre_exists(movie.id, genre.id):
                            _insert_movie_genre(movie.id, genre.id)

                created_count += 1
                if created_count % 100 == 0:
                    self.stdout.write(f'  Processed {created_count} movies...')

        self.stdout.write(self.style.SUCCESS(
            f'Done! Created: {created_count}, Skipped (existing): {skipped_count}'
        ))
