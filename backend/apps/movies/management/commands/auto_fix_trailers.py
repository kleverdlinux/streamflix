import time
import json
import urllib.request
import urllib.parse
from django.core.management.base import BaseCommand
from apps.movies.models import Movie

class Command(BaseCommand):
    help = 'Auto-fixes broken trailers using TMDB API to get official Spanish (or English) YouTube trailers.'

    def handle(self, *args, **options):
        movies = Movie.objects.filter(is_active=True)
        self.stdout.write(self.style.WARNING("🎬 Iniciando el Reparador de Tráilers (TMDB API)..."))
        
        fixed_count = 0
        api_key = "15d2ea6d0dc1d476efbca3eba2b9bbfb"
        
        for movie in movies:
            self.stdout.write(f"Buscando tráiler para: {movie.title}...")
            
            query = urllib.parse.quote(movie.title)
            search_url = f"https://api.themoviedb.org/3/search/movie?api_key={api_key}&query={query}"
            
            try:
                # 1. Search movie to get TMDB ID
                req = urllib.request.Request(search_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    
                if data.get('results') and len(data['results']) > 0:
                    tmdb_id = data['results'][0]['id']
                    
                    # 2. Get videos in Spanish (es-MX or es-ES) and English
                    # First try Spanish
                    video_url_es = f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos?api_key={api_key}&language=es-MX"
                    video_url_en = f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos?api_key={api_key}&language=en-US"
                    
                    youtube_key = None
                    
                    # Try fetching Spanish
                    req_es = urllib.request.Request(video_url_es, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req_es, timeout=5) as resp_es:
                        data_es = json.loads(resp_es.read().decode())
                        videos = [v for v in data_es.get('results', []) if v['site'] == 'YouTube' and v['type'] == 'Trailer']
                        if videos:
                            youtube_key = videos[0]['key']
                            
                    # If no Spanish trailer, fallback to English
                    if not youtube_key:
                        req_en = urllib.request.Request(video_url_en, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req_en, timeout=5) as resp_en:
                            data_en = json.loads(resp_en.read().decode())
                            videos = [v for v in data_en.get('results', []) if v['site'] == 'YouTube' and v['type'] == 'Trailer']
                            if videos:
                                youtube_key = videos[0]['key']
                                
                    if youtube_key:
                        movie.trailer_youtube_id = youtube_key
                        movie.save()
                        fixed_count += 1
                        self.stdout.write(self.style.SUCCESS(f"  ✅ Tráiler actualizado ({youtube_key})"))
                    else:
                        self.stdout.write(self.style.ERROR(f"  ❌ No se encontró tráiler en YouTube."))
                else:
                    self.stdout.write(self.style.ERROR(f"  ❌ Película no encontrada en TMDB."))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ Error de conexión TMDB: {e}"))
                
            time.sleep(0.5) # Prevent rate limiting
            
        self.stdout.write(self.style.SUCCESS(f"\n🎉 ¡Proceso completado! Se repararon {fixed_count} tráilers."))
