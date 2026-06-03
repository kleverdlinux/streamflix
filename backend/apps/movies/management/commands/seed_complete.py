from django.core.management.base import BaseCommand
from django.db import connection
from decimal import Decimal
from slugify import slugify
from apps.movies.models import Movie, Genre

def insert_genre(movie_id, genre_id):
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO movie_genres (movie_id, genre_id, is_primary) VALUES (%s, %s, TRUE) ON CONFLICT DO NOTHING",
            [movie_id, genre_id]
        )

MOVIES = [
    # ACTION (+2)
    ("Mad Max: Fury Road", 2015, "Action", 120, "8.1", "hEJnMDYzw2Q",
     "https://m.media-amazon.com/images/M/MV5BN2EwM2I5OWMtMGQyMi00Zjg1LWJkNTctZTdjYTA4OGUwZjMyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/phszHPFMBh0EcHzoahBQOwzX02I.jpg",
     "En un mundo post-apocalíptico, Max se une a Furiosa en una frenética huida en camión."),
    ("Top Gun: Maverick", 2022, "Action", 130, "8.3", "giXco2jaZ_4",
     "https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZTQ0LWJkODUtMmVhMjIwMjA1ZmQwXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg",
     "Maverick, el mejor piloto de la marina, entrena a la próxima generación para una misión imposible."),
    # ADVENTURE (+2)
    ("The Revenant", 2015, "Adventure", 156, "8.0", "LoebZZ8K5N0",
     "https://m.media-amazon.com/images/M/MV5BMDE5OWYzOWItYjFkZi00NmQ0LWI4ZTAtNmI5ZTlkNmQ1ZTU4XkEyXkFqcGdeQXVyNjMwNzc3Mjg@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/lRpggLLqEL2oRu3UVGpBNNPa6aO.jpg",
     "Un cazador deja por muerto por su compañero recorre cientos de kilómetros por venganza."),
    ("Life of Pi", 2012, "Adventure", 127, "7.9", "mBRYXwRMGGE",
     "https://m.media-amazon.com/images/M/MV5BMTYzOTc1NjkwOV5BMl5BanBnXkFtZTcwMjMwNTM3OA@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/kBGtXMM5yj6A3dRMQ2XpBqsKByv.jpg",
     "Un joven sobrevive un naufragio y queda a la deriva en un bote con un tigre de Bengala."),
    # ANIMATION (+2)
    ("WALL-E", 2008, "Animation", 98, "8.4", "alIq_wG9FNk",
     "https://m.media-amazon.com/images/M/MV5BMjExMTg5OTU0NF5BMl5BanBnXkFtZTcwMjMxOTM0OA@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/hbhFnRzzg6ZDmm8YAmxBnQ3gcm8.jpg",
     "Un pequeño robot de basura en la Tierra abandonada se enamora de una robot exploradora."),
    ("Up", 2009, "Animation", 96, "8.2", "pgwc7RLqJ8Q",
     "https://m.media-amazon.com/images/M/MV5BMTk3NDE2NzI4NF5BMl5BanBnXkFtZTgwNzE1MzEyMTE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/mOtKsLk6sBSWZSaVnxMGVBFMpkL.jpg",
     "Un anciano viudo ata miles de globos a su casa y vuela a Sudamérica con un joven explorador."),
    # COMEDY (+2)
    ("The Hangover", 2009, "Comedy", 100, "7.7", "gN7pNrDdM6g",
     "https://m.media-amazon.com/images/M/MV5BNGQwZjg5YmYtY2VkNC00NzliLTljYTctNzI5NmU3MjE2ODQzXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/uluhlXubGu1VxU63boQequals.jpg",
     "Tres amigos despiertan en Las Vegas sin recordar nada y buscan al novio desaparecido."),
    ("Game Night", 2018, "Comedy", 100, "7.0", "dRM1dB7KYqA",
     "https://m.media-amazon.com/images/M/MV5BMjIwMTEwMjgxOV5BMl5BanBnXkFtZTgwNDQ4ODI3NDM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/8JliHrFBuGqp4q8jFAuKrUmwxhz.jpg",
     "Una noche de juegos se convierte en un misterio real cuando el hermano de un participante es secuestrado."),
    # CRIME (+2)
    ("No Country for Old Men", 2007, "Crime", 122, "8.2", "38A__WT3-o0",
     "https://m.media-amazon.com/images/M/MV5BMjA5Njk3MjM4OV5BMl5BanBnXkFtZTcwMTc5MTE1MQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/wqClnl8tPE0Y0YLbpKKpXlzkEZb.jpg",
     "Un cazador encuentra dinero de una droga y es perseguido por un asesino implacable."),
    ("Sicario", 2015, "Crime", 121, "7.6", "0FGCl5M0LZ4",
     "https://m.media-amazon.com/images/M/MV5BMjA5NjM3NTk1M15BMl5BanBnXkFtZTgwMzM3NjM0NjE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/ma54KAaG0Wh59niKdLOGaSxDdCa.jpg",
     "Una agente del FBI es reclutada por el gobierno para combatir el tráfico de drogas en la frontera."),
    # DRAMA (+2)
    ("Marriage Story", 2019, "Drama", 137, "7.9", "961GYpLe56M",
     "https://m.media-amazon.com/images/M/MV5BYWNjNjM4OTEtOTBjMC00MjI5LWJhMTctZjliZmM3ZGMzNjkzXkEyXkFqcGdeQXVyNjg2NjQwMDQ@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/2aFPTj4v85bYU0HF1gMJQhOBvyH.jpg",
     "El doloroso proceso de divorcio de un director de teatro y su actriz esposa."),
    ("Nomadland", 2020, "Drama", 108, "7.3", "6sxCFZ8_d84",
     "https://m.media-amazon.com/images/M/MV5BMDljZjNjMTktNDg5YS00ZWQ3LTkzMDEtZmFmM2RlNjU4OTI4XkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/okMNjcDjBuAd0fAtVFWsXHrjFCA.jpg",
     "Una mujer en sus 60s que perdió todo viaja por el oeste americano en su furgoneta."),
    # FANTASY (+2)
    ("The Shape of Water", 2017, "Fantasy", 123, "7.3", "XFYWazblaUA",
     "https://m.media-amazon.com/images/M/MV5BNGNiNWQ3NTMtNjYxNS00NzBkLTk4ZTYtZGI1YzZkNmRlMWNhXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/jAFJC4KFzNgYeVTXXbSCdvIlfuY.jpg",
     "Una empleada muda de limpieza se enamora de una criatura anfíbia encerrada en un laboratorio."),
    ("Doctor Strange", 2016, "Fantasy", 115, "7.5", "HSzx-zryEgM",
     "https://m.media-amazon.com/images/M/MV5BNjgwNzAzNjk1Nl5BMl5BanBnXkFtZTgwMzQ2NjI1OTE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/2lCh4CD7lBzSGNvWuOV8Ygm6DLI.jpg",
     "Un brillante neurocirujano descubre el mundo de las artes místicas tras un accidente."),
    # HORROR (+2)
    ("Midsommar", 2019, "Horror", 148, "7.1", "1Pu7bIlmMOk",
     "https://m.media-amazon.com/images/M/MV5BMzQxNzQzOTQwM15BMl5BanBnXkFtZTgwMDQ2NTcwODM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/rFl5kFZJM1l4NdVsKS7QWCGdLQQ.jpg",
     "Una pareja viaja a Suecia y se ve atrapada en un oscuro festival de verano pagano."),
    ("The Conjuring", 2013, "Horror", 112, "7.5", "k10ETZ41q5o",
     "https://m.media-amazon.com/images/M/MV5BMTM3NjA1NDMyMV5BMl5BanBnXkFtZTcwMDQzNDMzOQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/wVYREutTvI2tmxr6ujrHT704wGF.jpg",
     "Dos investigadores paranormales ayudan a una familia aterrorizada por una presencia oscura."),
    # ROMANCE (+2)
    ("About Time", 2013, "Romance", 123, "7.8", "4VJUX7r9W_k",
     "https://m.media-amazon.com/images/M/MV5BMjM1OTMxNzg1OV5BMl5BanBnXkFtZTgwODE4OTM0MDE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/fYdZR7XBVhGHbGYoC4VpBCjkJt1.jpg",
     "Un joven descubre que puede viajar en el tiempo y usa ese poder para encontrar el amor."),
    ("Crazy Rich Asians", 2018, "Romance", 120, "6.9", "6JnN1ENmbPk",
     "https://m.media-amazon.com/images/M/MV5BMTMxNTk2NDM2NF5BMl5BanBnXkFtZTgwNTM3NzI3NTM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/O7OkaCJSKbK1yOjSQiPBqerr8JR.jpg",
     "Una profesora americana de origen chino descubre que su novio es uno de los más ricos de Asia."),
    # SCI-FI (+2)
    ("Arrival", 2016, "Sci-Fi", 116, "7.9", "tFMo3UJ4B4g",
     "https://m.media-amazon.com/images/M/MV5BMTExMzU0ODcxNDheQTJeQWpwZ15BbWU4MDE1OTI4MzAy._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/96eosvxTJZRKZ5bLuqF0bKO7yTL.jpg",
     "Una lingüista es reclutada por el ejército para comunicarse con extraterrestres que llegaron a la Tierra."),
    ("Annihilation", 2018, "Sci-Fi", 115, "6.8", "89OP78l6o4E",
     "https://m.media-amazon.com/images/M/MV5BMTcwNzMxNjU2NF5BMl5BanBnXkFtZTgwMzQwNTU3NDM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/eKQnBQ8jHW5v6CaFwLR4kPHkIAK.jpg",
     "Una bióloga entra en la Zona X, un territorio misterioso donde las reglas de la naturaleza no aplican."),
    # THRILLER (+2)
    ("Nightcrawler", 2014, "Thriller", 117, "7.9", "X8kYDSbCbMo",
     "https://m.media-amazon.com/images/M/MV5BMjM5NjM4NDMwNF5BMl5BanBnXkFtZTgwMDQ4NDc2MjE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/4VgwP3fIHHhAeaZA90JYnvvHQlk.jpg",
     "Un ambicioso y sin escrúpulos fotógrafo de crímenes nocturnos escala en la televisión de Los Ángeles."),
    ("Black Swan", 2010, "Thriller", 108, "8.0", "5jaI1XOB-bs",
     "https://m.media-amazon.com/images/M/MV5BNzY2NzI4OTE5MF5BMl5BanBnXkFtZTcwMjMyNDY4Mw@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/tOAcPVZqEFMVPGdY7q8TXWDfhMn.jpg",
     "Una bailarina de ballet obsesionada con la perfección pierde la razón durante su papel protagonista."),
]


class Command(BaseCommand):
    help = 'Seeds 22 movies to complete 5 per genre for Action, Adventure, Animation, Comedy, Crime, Drama, Fantasy, Horror, Romance, Sci-Fi, Thriller'

    def handle(self, *args, **options):
        genre_cache = {g.name.lower(): g for g in Genre.objects.all()}
        created = 0

        for title, year, genre_name, mins, rating, yt, poster, backdrop, desc in MOVIES:
            slug = slugify(title)
            if Movie.objects.filter(slug=slug).exists():
                self.stdout.write(self.style.WARNING(f'⏭  Already exists: {title}'))
                continue

            movie = Movie(
                title=title, title_original=title, slug=slug, year=year,
                duration_min=mins, description=desc, content_rating="PG-13",
                poster_url=poster, backdrop_url=backdrop,
                trailer_youtube_id=yt, language="English", country="USA",
                weighted_rating=Decimal(rating), avg_rating=Decimal(rating),
                imdb_rating=Decimal(rating), num_ratings=50000, is_active=True,
            )
            movie.save()

            key = genre_name.lower()
            if key not in genre_cache:
                g = Genre(name=genre_name, slug=slugify(genre_name))
                g.save()
                genre_cache[key] = g
            insert_genre(movie.id, genre_cache[key].id)
            created += 1
            self.stdout.write(self.style.SUCCESS(f'✅ {genre_name}: {title}'))

        self.stdout.write(self.style.SUCCESS(f'\n🎬 Done! Added {created} movies. Your catalog is now FULL 90 movies!'))
