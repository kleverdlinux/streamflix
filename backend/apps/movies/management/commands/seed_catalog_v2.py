import os
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from decimal import Decimal
from slugify import slugify
from apps.movies.models import Movie, Genre

def insert_genre(movie_id, genre_id):
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO movie_genres (movie_id, genre_id, is_primary) VALUES (%s, %s, TRUE) ON CONFLICT DO NOTHING",
            [movie_id, genre_id]
        )

# List of complete movies from 2000-2026, including sequels and plan assignments.
# Format: (Title, Year, Genre, Mins, Rating, Trailer, Poster, Backdrop, Desc, MinPlanId)
# Plan IDs: 1 = Gratuito, 2 = Básico, 3 = Intermedio, 4 = Premium
MOVIES_V2 = [
    # --- Acción & Aventura ---
    ("John Wick", 2014, "Acción", 101, "7.4", "C0BMx-qxsP4", 
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg", 
     "https://image.tmdb.org/t/p/original/mMZRKb3NVTcgDjlKhX9XOp8U0Lq.jpg", 
     "Un ex-asesino a sueldo sale de su retiro para rastrear a los mafiosos que mataron a su perro.", 1),
    ("John Wick: Capítulo 2", 2017, "Acción", 122, "7.4", "XGk2EfbD_Cs",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/u51XkO6A2d0vW01S6r6D6q04e3X.jpg",
     "https://image.tmdb.org/t/p/original/51xONmJc1R8LWeo1P5lYgLd0T1i.jpg",
     "John viaja a Roma, donde se enfrenta a algunos de los asesinos más letales del mundo.", 2),
    ("John Wick: Capítulo 3 - Parabellum", 2019, "Acción", 130, "7.4", "pU8-7BX9KNI",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ziEuG1essDuWuC5lpWUaw1uXY2O.jpg",
     "https://image.tmdb.org/t/p/original/vVpKiVsqJh2MacM5k4i4dK9BBRV.jpg",
     "Con una recompensa de 14 millones sobre su cabeza, John lucha para escapar de Nueva York.", 3),
    ("John Wick 4", 2023, "Acción", 169, "7.8", "yjRHZEUamCc",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jF0m9H3u4iU3ZkE2n2yX0m2Gf1w.jpg",
     "https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtec02S5uCku.jpg",
     "John descubre un camino para derrotar a la Alta Mesa y ganar su libertad.", 4),
    
    # --- Batman (El Caballero de la Noche) ---
    ("Batman Inicia", 2005, "Acción", 140, "8.2", "neY2xVmOfUM",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8RW2runSEc34zm5ne2F13I75gP3.jpg",
     "https://image.tmdb.org/t/p/original/tU1H4u16v08QvW1pTqB2q010p72.jpg",
     "El joven Bruce Wayne viaja a Oriente Medio y se convierte en el justiciero de Gotham.", 1),
    ("El Caballero de la Noche", 2008, "Acción", 152, "9.0", "EXeTwQWrcwY",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
     "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CejMIOX.jpg",
     "Batman se enfrenta a su mayor desafío psicológico y físico: El Joker.", 3),
    ("El Caballero de la Noche Asciende", 2012, "Acción", 164, "8.4", "g8evyE9TuYk",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/hr0L2aueqlP2BYUblTTjmtn0hw.jpg",
     "https://image.tmdb.org/t/p/original/fQq1FWp1rC89xDrRMuy0QjHw0O3.jpg",
     "Ocho años después, un nuevo terrorista llamado Bane obliga a Batman a salir del exilio.", 4),
     
    # --- El Señor de los Anillos ---
    ("El Señor de los Anillos: La Comunidad del Anillo", 2001, "Fantasía", 178, "8.8", "V75dSyETjR4",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
     "https://image.tmdb.org/t/p/original/bQLmMUVyvwWJk2H6h5L9I86g0Uu.jpg",
     "Un modesto hobbit de la Comarca y ocho compañeros emprenden un viaje para destruir el poderoso Anillo Único.", 1),
    ("El Señor de los Anillos: Las Dos Torres", 2002, "Fantasía", 179, "8.7", "LbfMDwc4azU",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/5VTN0pR8gcqV3G4X4qX2aV20z7L.jpg",
     "https://image.tmdb.org/t/p/original/7c9UVPPkYxHLXEEsE8N4jEIfL8o.jpg",
     "Frodo y Sam continúan su camino hacia Mordor, mientras el resto de la Comunidad defiende Rohan.", 2),
    ("El Señor de los Anillos: El Retorno del Rey", 2003, "Fantasía", 201, "9.0", "r5X-hFf6Bwo",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
     "https://image.tmdb.org/t/p/original/8BPZO0Bf8TeAy8znF43z8soK3ys.jpg",
     "La batalla final por la Tierra Media comienza mientras Frodo y Sam se acercan al Monte del Destino.", 4),

    # --- Dune ---
    ("Dune", 2021, "Ciencia Ficción", 155, "8.0", "n9xhJrPXop4",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
     "https://image.tmdb.org/t/p/original/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg",
     "Paul Atreides viaja al planeta más peligroso del universo para asegurar el futuro de su familia.", 2),
    ("Dune: Parte Dos", 2024, "Ciencia Ficción", 166, "8.8", "Way9Dexny3w",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/1pdfLvkbY9ohJlCjQH2TGbi2kY.jpg",
     "https://image.tmdb.org/t/p/original/xOMo8BRK7PTX090fJ13A28FIfj0.jpg",
     "Paul Atreides se une a Chani y a los Fremen en su búsqueda de venganza contra los conspiradores.", 4),

    # --- Spider-Verse ---
    ("Spider-Man: Un Nuevo Universo", 2018, "Animación", 117, "8.4", "tg52up16eq0",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
     "https://image.tmdb.org/t/p/original/ka1aT4MElSLQaleBhZ6LxvMxkAR.jpg",
     "El adolescente Miles Morales se convierte en el Spider-Man de su universo.", 1),
    ("Spider-Man: A Través del Spider-Verso", 2023, "Animación", 140, "8.6", "cqGjhVJWtEg",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
     "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
     "Miles Morales se catapulta a través del multiverso y se encuentra con la Sociedad Arácnida.", 4),

    # --- Avatar ---
    ("Avatar", 2009, "Ciencia Ficción", 162, "7.9", "5PSNL1qE6VY",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
     "https://image.tmdb.org/t/p/original/o0s4XsEDfDlvit5pDRKjzXR4pp2.jpg",
     "Un marine parapléjico es enviado a la luna Pandora en una misión única.", 1),
    ("Avatar: El Camino del Agua", 2022, "Ciencia Ficción", 192, "7.6", "a8Gx8wiNbs8",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/k5Wk9aI0A2gB2T1Hw2m7wK9xH5B.jpg",
     "https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtec02S5uCku.jpg",
     "Jake Sully vive con su nueva familia en el planeta Pandora hasta que una amenaza familiar regresa.", 3),
     
    # --- Matrix ---
    ("The Matrix", 1999, "Ciencia Ficción", 136, "8.7", "vKQi3bN9ZgM",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
     "https://image.tmdb.org/t/p/original/pxOiKwRvNp3zFOiuwpYpzlGW8qO.jpg",
     "Un hacker descubre la verdadera naturaleza de su realidad y su rol en la guerra.", 1),
    ("The Matrix Recargado", 2003, "Ciencia Ficción", 138, "7.2", "HVrGMhEEwKk",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/1Hja1j5LPE3sD4W0K2e27Dq8D31.jpg",
     "https://image.tmdb.org/t/p/original/oB0Z0Z5VlK0e2E6yGqD6R6J2I7z.jpg",
     "Neo lidera la revuelta contra las máquinas en Zion.", 2),
    ("The Matrix Revoluciones", 2003, "Ciencia Ficción", 129, "6.7", "Njr2gQ1jY4o",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/3P0n0M5q5u4R60g3X7Jq4y7K5I3.jpg",
     "https://image.tmdb.org/t/p/original/5sXmXQ5O8O1A9Xg2T2zU0A9k1T.jpg",
     "La ciudad humana de Zion se defiende del ataque masivo de las máquinas.", 2),

    # --- Extras variados ---
    ("Parasite", 2019, "Suspenso", 132, "8.5", "5xH0HfJHsaY",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
     "https://image.tmdb.org/t/p/original/ApiBzeaa95TNYLieFkPMamMibei.jpg",
     "Una familia pobre se infiltra en la casa de una familia adinerada con un oscuro secreto.", 4),
    ("Interestelar", 2014, "Ciencia Ficción", 169, "8.7", "zSWdZVtXT7E",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QlsEOWepvdIV6glMEeqO8M.jpg",
     "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
     "Un grupo de exploradores viaja a través de un agujero de gusano para salvar la humanidad.", 3),
    ("La La Land", 2016, "Musical", 128, "8.0", "0pdqf4P9MB8",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uDO8zWDhfWwoFdKS4fzkUJt0f.jpg",
     "https://image.tmdb.org/t/p/original/nadTlnTE6DdgmMCDkTv9Y8UXfEF.jpg",
     "Un pianista de jazz y una aspirante a actriz se enamoran en Los Ángeles.", 2),
    ("Gladiador", 2000, "Guerra", 155, "8.5", "owK1qxDselE",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ty8TGRuvJLPUmAR1H1nRIsgwvq0.jpg",
     "https://image.tmdb.org/t/p/original/hND6l2rBGSuBQVVeZEr2pZR5V0N.jpg",
     "Un general romano traicionado busca venganza como gladiador.", 1),
    ("Top Gun: Maverick", 2022, "Acción", 130, "8.3", "giXco2jaZ_4",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg",
     "https://image.tmdb.org/t/p/original/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg",
     "Maverick entrena a la próxima generación de pilotos para una misión imposible.", 4),
    ("Oppenheimer", 2023, "Drama", 180, "8.4", "uYPbbksJxIg",
     "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
     "https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
     "La historia del científico J. Robert Oppenheimer y su rol en la bomba atómica.", 4),
]

class Command(BaseCommand):
    help = 'Limpia películas inválidas y siembra el catálogo premium con trailers, portadas, secuelas y control de planes.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🧹 Limpiando base de datos de películas sin trailer o sin imagen...'))
        
        with transaction.atomic():
            # Eliminar películas defectuosas
            invalid_movies = Movie.objects.filter(
                trailer_youtube_id__isnull=True
            ) | Movie.objects.filter(
                trailer_youtube_id=''
            ) | Movie.objects.filter(
                poster_url__isnull=True
            ) | Movie.objects.filter(
                poster_url=''
            )
            
            count = invalid_movies.count()
            invalid_movies.delete()
            self.stdout.write(self.style.SUCCESS(f'✅ Se eliminaron {count} películas defectuosas.'))

            genre_cache = {g.name.lower(): g for g in Genre.objects.all()}
            created = 0

            self.stdout.write(self.style.WARNING('\n🚀 Sembrando nuevas películas de alta calidad (2000-2026)...'))

            for title, year, genre_name, mins, rating, yt, poster, backdrop, desc, min_plan in MOVIES_V2:
                slug = slugify(title)
                
                # Actualizar si existe, crear si no
                movie, was_created = Movie.objects.update_or_create(
                    slug=slug,
                    defaults={
                        'title': title,
                        'title_original': title,
                        'year': year,
                        'duration_min': mins,
                        'description': desc,
                        'content_rating': "PG-13",
                        'poster_url': poster,
                        'backdrop_url': backdrop,
                        'trailer_youtube_id': yt,
                        'language': "Español",
                        'country': "USA",
                        'weighted_rating': Decimal(rating),
                        'avg_rating': Decimal(rating),
                        'imdb_rating': Decimal(rating),
                        'num_ratings': 50000,
                        'is_active': True,
                        'min_plan_id': min_plan,
                    }
                )

                # Asegurar el género
                key = genre_name.lower()
                if key not in genre_cache:
                    g = Genre.objects.create(name=genre_name, slug=slugify(genre_name))
                    genre_cache[key] = g
                
                insert_genre(movie.id, genre_cache[key].id)
                
                if was_created:
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f'✨ Agregada: {title} (Plan ID: {min_plan})'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'🔄 Actualizada: {title} (Plan ID: {min_plan})'))

        self.stdout.write(self.style.SUCCESS(f'\n🎉 ¡Operación exitosa! {created} películas nuevas añadidas. El catálogo está optimizado y estricto.'))
