"""
Management command to:
1. Deactivate all movies that have no poster_url (old MovieLens data)
2. Fix any remaining poster issues for the premium seeded movies
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.movies.models import Movie

# Final verified poster URLs for any still-missing movies
POSTER_FIXES = {
    "Gone Girl": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMTk0MDQ3MzAzOV5BMl5BanBnXkFtZTgwNzU1NzMyMjE@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/KlRBmqNx2YlqiRlpEVVkiEJ19Lp.jpg",
        "trailer": "2-_-1nJf8Vg",
    },
    "Pride & Prejudice": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMTA1NDQ3NTcyOTNeQTJeQWpwZ15BbWU3MDA0MzA4MzE@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/k7cR6IdFCFvCT3p2eLVKNe9AHEM.jpg",
        "trailer": "1dFo2EBuMCU",
    },
    "Eternal Sunshine of the Spotless Mind": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMTY4NzcwODg3Nl5BMl5BanBnXkFtZTcwNTEwOTMyMw@@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/zTpFVYKVOVdz1JCeGBp1EqMQAtaO.jpg",
        "trailer": "07-QBPNGHiM",
    },
    "La La Land": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/nadTlnTE6DdgmMCDkTv9Y8UXfEF.jpg",
        "trailer": "0pdqf4P9MB8",
    },
    "Ex Machina": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMTUxNzc0OTIxMV5BMl5BanBnXkFtZTgwNDI3NzU2NDE@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/8SRUfRUi6x4O68n0VBeJma3jMXS.jpg",
        "trailer": "EoQuVnKhxaM",
    },
    "Get Out": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMjUxMDQwNjcyNl5BMl5BanBnXkFtZTgwNzcwMzc1MTI@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/b94xNx9zyh4ckEFJm5apMxF6mEz.jpg",
        "trailer": "DzfpyUB60YY",
    },
    "Hereditary": {
        "poster": "https://m.media-amazon.com/images/M/MV5BOTU0NTExNTAxNF5BMl5BanBnXkFtZTgwMjkyNTkxNTM@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/sGtKnDGS3bMCRW7HFfxwO05AQaQ.jpg",
        "trailer": "V6wWKNij_1M",
    },
    "Pan's Labyrinth": {
        "poster": "https://m.media-amazon.com/images/M/MV5BOTA5MTU0OTc4OV5BMl5BanBnXkFtZTcwMzIxNTc0MQ@@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/4j7O7n4BhWMEiBcmUFJHv7CgkAZ.jpg",
        "trailer": "mBSTxYqGMHg",
    },
    "Harry Potter and the Sorcerer's Stone": {
        "poster": "https://m.media-amazon.com/images/M/MV5BNjQ3NWNlNmQtMTE5ZS00MDdmLTlkZjUtZTBlM2UxMGYwZjFjXkEyXkFqcGdeQXVyNjUwNzk3NDc@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/hziiv14OpD73UwoaZrjKyFJ3ict.jpg",
        "trailer": "VyHV0BRtdxo",
    },
    "Superbad": {
        "poster": "https://m.media-amazon.com/images/M/MV5BY2VkMzZkZmQtYzZlMS00ZmY5LThmNmQtYzZlYWMzYzQ2NDUzXkEyXkFqcGdeQXVyNTIzOTk5ODM@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/gt7wFCdFdOBMfMU8YB9aMcJ8vfb.jpg",
        "trailer": "4eaZ_48ZYog",
    },
    "The Grand Budapest Hotel": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMzM5NjUxOTEyML5BMl5BanBnXkFtZTgwNjEyMDM0MDE@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/dEzMaQqEHiSHNbDmgpKN9KaG2Y.jpg",
        "trailer": "1Fg0iJ0n-AM",
    },
    "Coco": {
        "poster": "https://m.media-amazon.com/images/M/MV5BYjQ5NjM0Y2YtNjZkNC00ZDhkLWJjMWItN2QyNzFkMDE3ZjAxXkEyXkFqcGdeQXVyODIxMzk5NjA@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/askg3SMvhqEl4OL52YuvdtY40Yb.jpg",
        "trailer": "jL40zT9Tir4",
    },
    "Spirited Away": {
        "poster": "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NjNkMWFhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXvejdRXBvuF.jpg",
        "trailer": "ByXuk9QqQkk",
    },
    "Interstellar": {
        "poster": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
        "trailer": "zSWdZVtXT7E",
    },
    "Shutter Island": {
        "poster": "https://m.media-amazon.com/images/M/MV5BYzhiNDkyNzktNTZmYS00ZTdkLTkzNWQtYzg1OGMyZGJiZDFiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/jHPdRd7P0GYmpAXzCpS5bHxWM2s.jpg",
        "trailer": "5iaYLCiq5RM",
    },
}


class Command(BaseCommand):
    help = 'Cleans catalog: deactivates movies without posters and fixes remaining poster URLs'

    def handle(self, *args, **options):

        # STEP 1: Fix any still-missing posters from our premium list
        self.stdout.write(self.style.WARNING('\n📽️  Step 1: Fixing missing posters for premium movies...'))
        fixed = 0
        for title, data in POSTER_FIXES.items():
            try:
                movie = Movie.objects.get(title=title)
                if not movie.poster_url or 'tmdb' not in (movie.poster_url or ''):
                    movie.poster_url = data['poster']
                    movie.backdrop_url = data['backdrop']
                    movie.trailer_youtube_id = data['trailer']
                    movie.save()
                    fixed += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✅ Fixed poster: {title}'))
                else:
                    self.stdout.write(f'  ⏭️  Already has poster: {title}')
            except Movie.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  ⚠️  Not in DB: {title}'))

        # STEP 2: Deactivate all movies with no poster (old MovieLens junk data)
        self.stdout.write(self.style.WARNING('\n🧹 Step 2: Hiding movies without posters from catalog...'))
        no_poster_qs = Movie.objects.filter(
            is_active=True
        ).filter(
            poster_url__isnull=True
        ) | Movie.objects.filter(
            is_active=True,
            poster_url=''
        )

        count = no_poster_qs.count()
        no_poster_qs.update(is_active=False)
        self.stdout.write(self.style.SUCCESS(
            f'  🙈 Hidden {count} movies without poster art from the catalog.'
        ))

        # STEP 3: Summary
        active_count = Movie.objects.filter(is_active=True).count()
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ CATALOG CLEANUP DONE!\n'
            f'   → {fixed} poster URLs fixed\n'
            f'   → {count} old movies hidden (no poster)\n'
            f'   → {active_count} premium movies now showing in your catalog\n'
        ))
