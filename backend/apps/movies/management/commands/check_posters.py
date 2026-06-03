import os
import urllib.request
import urllib.error
from django.core.management.base import BaseCommand
from apps.movies.models import Movie

class Command(BaseCommand):
    help = 'Check all active movie posters and write broken ones to a file'

    def handle(self, *args, **options):
        broken_movies = []
        movies = Movie.objects.filter(is_active=True)
        
        self.stdout.write(f"Checking {movies.count()} movies...")
        
        for movie in movies:
            if not movie.poster_url:
                broken_movies.append(f"{movie.title} (No URL)")
                continue
                
            try:
                # Use a standard user agent
                req = urllib.request.Request(movie.poster_url, headers={'User-Agent': 'Mozilla/5.0'})
                try:
                    response = urllib.request.urlopen(req, timeout=5)
                    # If it didn't throw an exception, the URL is valid (200 OK)
                except urllib.error.HTTPError as e:
                    broken_movies.append(f"{movie.title} (HTTP {e.code}): {movie.poster_url}")
                except urllib.error.URLError as e:
                    broken_movies.append(f"{movie.title} (URL Error {e.reason}): {movie.poster_url}")
            except Exception as e:
                broken_movies.append(f"{movie.title} (Error: {str(e)}): {movie.poster_url}")
                
        output_path = r"C:\Users\ASUS\.gemini\antigravity\scratch\broken_posters.txt"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for item in broken_movies:
                f.write(f"{item}\n")
                
        self.stdout.write(self.style.SUCCESS(f"Done! Found {len(broken_movies)} broken posters. Wrote results to {output_path}"))
