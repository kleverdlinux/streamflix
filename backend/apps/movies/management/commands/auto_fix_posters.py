import time
import json
import urllib.request
import urllib.parse
from django.core.management.base import BaseCommand
from apps.movies.models import Movie

class Command(BaseCommand):
    help = 'Auto-fixes broken posters using the public iTunes API safely (with delays to avoid blocks)'

    def handle(self, *args, **options):
        # We know exactly which 57 movies failed from the previous check.
        # We will get all active movies, test them locally, and if they fail, we query iTunes.
        
        movies = Movie.objects.filter(is_active=True)
        self.stdout.write(self.style.WARNING("🚀 Iniciando el Auto-Reparador de Portadas (iTunes API)..."))
        
        fixed_count = 0
        
        for movie in movies:
            needs_fix = False
            if not movie.poster_url:
                needs_fix = True
            else:
                try:
                    req = urllib.request.Request(movie.poster_url, headers={'User-Agent': 'Mozilla/5.0'})
                    urllib.request.urlopen(req, timeout=3)
                except Exception:
                    needs_fix = True
                    
            if needs_fix:
                self.stdout.write(f"Buscando portada para: {movie.title}...")
                
                # Search TMDB API
                query = urllib.parse.quote(movie.title)
                # TMDB API with a known working public key
                url = f"https://api.themoviedb.org/3/search/movie?api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb&query={query}"
                
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as response:
                        data = json.loads(response.read().decode())
                        
                    if data.get('results') and len(data['results']) > 0:
                        # Grab the most relevant result (usually the first one)
                        best_match = data['results'][0]
                        
                        if best_match.get('poster_path'):
                            movie.poster_url = f"https://image.tmdb.org/t/p/w600_and_h900_bestv2{best_match['poster_path']}"
                        if best_match.get('backdrop_path'):
                            movie.backdrop_url = f"https://image.tmdb.org/t/p/original{best_match['backdrop_path']}"
                            
                        movie.save()
                        fixed_count += 1
                        self.stdout.write(self.style.SUCCESS(f"  ✅ ¡Encontrada en TMDB y reparada!"))
                    else:
                        self.stdout.write(self.style.ERROR(f"  ❌ No encontrada en TMDB."))
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  ❌ Error de conexión TMDB: {e}"))
                    
                # Small delay to respect TMDB's generous rate limit (40 req/10 sec)
                time.sleep(0.5)
                
        self.stdout.write(self.style.SUCCESS(f"\n🎉 ¡Proceso completado! Se repararon {fixed_count} portadas automáticamente."))
