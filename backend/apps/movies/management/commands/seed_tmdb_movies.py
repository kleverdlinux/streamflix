import time
import json
import urllib.request
import urllib.parse
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils.text import slugify
from apps.movies.models import Movie, Genre, MovieGenre

TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb"

GENRE_MAP = {
    'action': 28,
    'adventure': 12,
    'animation': 16,
    'childrens': 10751, # Family
    'comedy': 35,
    'crime': 80,
    'documentary': 99,
    'drama': 18,
    'fantasy': 14,
    'film-noir': 9648, # Mystery fallback
    'horror': 27,
    'musical': 10402,
    'mystery': 9648,
    'romance': 10749,
    'sci-fi': 878,
    'thriller': 53,
    'war': 10752,
    'western': 37
}

class Command(BaseCommand):
    help = 'Auto-poblar la base de datos con TMDB hasta alcanzar 15 películas por género (todo en Español).'

    def fetch_json(self, url):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode())
        except Exception:
            return None

    def get_trailer(self, tmdb_id):
        data = self.fetch_json(f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos?api_key={TMDB_API_KEY}&language=es-MX")
        if data and 'results' in data:
            videos = [v for v in data['results'] if v['site'] == 'YouTube' and v['type'] == 'Trailer']
            if videos: return videos[0]['key']
            
        # Fallback English
        data_en = self.fetch_json(f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos?api_key={TMDB_API_KEY}&language=en-US")
        if data_en and 'results' in data_en:
            videos = [v for v in data_en['results'] if v['site'] == 'YouTube' and v['type'] == 'Trailer']
            if videos: return videos[0]['key']
            
        return None

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("🚀 Iniciando Motor de Carga TMDB (Objetivo: 15 por género)..."))
        
        genres = Genre.objects.all()
        target_per_genre = 20
        
        total_added = 0
        
        for genre in genres:
            tmdb_genre_id = GENRE_MAP.get(genre.slug.lower())
            if not tmdb_genre_id:
                continue
                
            # Count current active movies in this genre
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) FROM movies m
                    JOIN movie_genres mg ON m.id = mg.movie_id
                    WHERE mg.genre_id = %s AND m.is_active = True
                """, [genre.id])
                current_count = cursor.fetchone()[0]
                
            if current_count >= target_per_genre:
                self.stdout.write(self.style.SUCCESS(f"✅ Género {genre.name} ya tiene {current_count} películas."))
                continue
                
            needed = target_per_genre - current_count
            self.stdout.write(self.style.WARNING(f"⬇️ Descargando {needed} películas para {genre.name}..."))
            
            page = 1
            added_for_genre = 0
            
            while added_for_genre < needed and page <= 5:
                discover_url = f"https://api.themoviedb.org/3/discover/movie?api_key={TMDB_API_KEY}&with_genres={tmdb_genre_id}&language=es-MX&sort_by=popularity.desc&page={page}"
                data = self.fetch_json(discover_url)
                
                if not data or not data.get('results'):
                    break
                    
                for result in data['results']:
                    if added_for_genre >= needed:
                        break
                        
                    # Skip if no poster/backdrop
                    if not result.get('poster_path') or not result.get('backdrop_path'):
                        continue
                        
                    title = result['title']
                    slug = slugify(title)
                    
                    # Check if exists
                    if Movie.objects.filter(slug=slug).exists() or Movie.objects.filter(title=title).exists():
                        continue
                        
                    trailer_id = self.get_trailer(result['id'])
                    if not trailer_id:
                        continue # Skip movies without trailers to ensure max quality
                        
                    # Create Movie
                    movie = Movie.objects.create(
                        title=title,
                        title_original=result.get('original_title', title),
                        slug=slug,
                        description=result.get('overview', ''),
                        year=int(result.get('release_date', '2020')[:4]) if result.get('release_date') else 2020,
                        poster_url=f"https://image.tmdb.org/t/p/w600_and_h900_bestv2{result['poster_path']}",
                        backdrop_url=f"https://image.tmdb.org/t/p/original{result['backdrop_path']}",
                        trailer_youtube_id=trailer_id,
                        language='es',
                        content_rating='PG-13',
                        duration_min=120,
                        avg_rating=round(result.get('vote_average', 7.0), 1),
                        num_ratings=result.get('vote_count', 100),
                        weighted_rating=result.get('vote_average', 7.0),
                        is_active=True
                    )
                    
                    # Link to genre using raw SQL
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "INSERT INTO movie_genres (movie_id, genre_id, is_primary) VALUES (%s, %s, %s)",
                            [movie.id, genre.id, True]
                        )
                        
                    added_for_genre += 1
                    total_added += 1
                    self.stdout.write(f"  🎬 Agregada: {title} (Tráiler: {trailer_id})")
                    time.sleep(0.3)
                    
                page += 1
                
        self.stdout.write(self.style.SUCCESS(f"\n🎉 ¡Carga masiva completada! Se agregaron {total_added} películas nuevas de alta calidad."))
