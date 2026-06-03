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
    # CHILDREN'S
    ("Moana", 2016, "Children's", 107, "8.0", "LKFuXETZUsI",
     "https://m.media-amazon.com/images/M/MV5BMjIwNTM0NjQ4Nl5BMl5BanBnXkFtZTgwNjc4NDgzMDI@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/1mMVbpMsJfNMTDiLDCXPLWHSmT0.jpg",
     "Una joven aventurera zarpa en un audaz viaje para salvar a su pueblo."),
    ("Paddington", 2014, "Children's", 95, "7.2", "hLbEtGdJUO0",
     "https://m.media-amazon.com/images/M/MV5BMTQ4ODQwMDA1OF5BMl5BanBnXkFtZTgwMTYxMDA0MzE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/qnq2uogrGOjHqLJGu6SpkPMOOLi.jpg",
     "Un oso parlante de Perú viaja a Londres buscando un hogar."),
    ("Wonka", 2023, "Children's", 116, "7.2", "otNh9bTjXWg",
     "https://m.media-amazon.com/images/M/MV5BNDYzNWM2NDAtNGNjZi00OGZhLWI0OWItZmQ1NTY5NmFkYzVhXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/qhb1qOilapqInsr8la0Y0zPCCpg.jpg",
     "Los primeros años del excéntrico chocolatero Willy Wonka."),
    ("The BFG", 2016, "Children's", 117, "6.4", "R2wd7YO8MrE",
     "https://m.media-amazon.com/images/M/MV5BMTg2NDA3MTA0NF5BMl5BanBnXkFtZTgwMjI3MTU3ODE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/b7Fcj5yQJYjAiicw8xnk0N5ISXO.jpg",
     "Una niña huérfana hace amistad con un gigante amigable llamado BFG."),
    ("Raya and the Last Dragon", 2021, "Children's", 107, "7.3", "1VIZ89FEjYI",
     "https://m.media-amazon.com/images/M/MV5BNjkwMjMyMzItZGMwMy00MGQ5LWJjNjUtN2JhNzM2NzM4OTQxXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/lQOvdDQ6LMD9XaE3m0Lss3HSNYi.jpg",
     "Una guerrera busca al último dragón para salvar a su mundo fragmentado."),
    # DOCUMENTARY
    ("Free Solo", 2018, "Documentary", 100, "8.2", "urRVZ4SW7WU",
     "https://m.media-amazon.com/images/M/MV5BMjMyOTM4MDMxNV5BMl5BanBnXkFtZTgwNzM2MDMwNjM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/bCFOy0EFLQ1BpH1Qrj9sAG6VXRB.jpg",
     "Alex Honnold intenta escalar El Capitan sin cuerdas de seguridad."),
    ("The Social Dilemma", 2020, "Documentary", 94, "7.6", "uaaC57tcci0",
     "https://m.media-amazon.com/images/M/MV5BODRhNjU4NTgtZjgzOS00OGEzLWEyZDUtZGRlMDdjMzZhZDlmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/xrqoEWHkqnNyNmONtFLUXdkLIZM.jpg",
     "Expertos tecnológicos revelan el lado oscuro de las redes sociales."),
    ("My Octopus Teacher", 2020, "Documentary", 85, "8.1", "3s0LTDhqe5A",
     "https://m.media-amazon.com/images/M/MV5BNzEzMTI1NjYtMGU5My00ZjFmLTkyNGMtNjM5NzUxMzE1YzFlXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/5HbxvXBMIEJbhV6LHXjrSJVScY6.jpg",
     "Un cineasta forja una amistad con un pulpo en el océano sudafricano."),
    ("13th", 2016, "Documentary", 100, "8.2", "krfcq5pF8u8",
     "https://m.media-amazon.com/images/M/MV5BMjZjMDUwODAtZGI3Mi00NjgyLThlZjEtZGEzZDM3ZjhiNjQ0XkEyXkFqcGdeQXVyNjE4OTQ5MDk@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/y1OAPoabKXkERHpKyXqm1fz5Wr1.jpg",
     "Exploración de la intersección entre raza, justicia y encarcelamiento masivo en EE.UU."),
    ("Man on Wire", 2008, "Documentary", 94, "7.7", "8dF2-_UQEAs",
     "https://m.media-amazon.com/images/M/MV5BMTM1NDkyOTQxNl5BMl5BanBnXkFtZTcwNjExNjgwMQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/lLrLDIJEGJ5kKcHVMOLNRIPRXMf.jpg",
     "La historia del funambulista que cruzó las Torres Gemelas en 1974."),
    # FILM-NOIR
    ("Drive", 2011, "Film-Noir", 100, "7.8", "oV_D5O-H0k4",
     "https://m.media-amazon.com/images/M/MV5BNmNhZmYyNWQtZGI0Ni00OTlhLWIyNmEtNjE0YWQ0YmM3NzZkXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/ai6jMFPDYvBiNQnpBjIIcnfFYCf.jpg",
     "Un conductor de stunts que trabaja como chofer en robos nocturno se enamora de su vecina."),
    ("Zodiac", 2007, "Film-Noir", 157, "7.7", "rt-2cxAiPJk",
     "https://m.media-amazon.com/images/M/MV5BODYzMmUyMmItZDRhZi00ZGQyLWEzNDgtN2IwNDkxNzQ1MjBhXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/zCYZsyQIFVXhU6LgRNNqxPQiIVz.jpg",
     "La caza del asesino en serie Zodiac que aterrorizó San Francisco."),
    ("Sin City", 2005, "Film-Noir", 124, "8.0", "j_TrKBfBWVQ",
     "https://m.media-amazon.com/images/M/MV5BMTQ2MTM4MzQzN15BMl5BanBnXkFtZTYwMzQ3Njc3._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/nPCcQdPF4jvxn7y9b5mGNBDRFGY.jpg",
     "Historias entrelazadas de la oscura y violenta Basin City."),
    ("Brick", 2005, "Film-Noir", 110, "7.3", "qUCxVCUQLHM",
     "https://m.media-amazon.com/images/M/MV5BMTM1Mzc3NzQ2Nl5BMl5BanBnXkFtZTYwOTA5OTM3._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/vMDxBpjnOkpQfD9oF8dJf6yFvBP.jpg",
     "Un estudiante investiga la desaparición de su ex novia en el mundo criminal."),
    ("Mulholland Drive", 2001, "Film-Noir", 147, "7.9", "C0dKlhk0fBA",
     "https://m.media-amazon.com/images/M/MV5BNDg5MTk2ODE3NV5BMl5BanBnXkFtZTcwMjkyMzk0Mw@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/gLDO5OOVDWV4JpGPYaVGmjqFTOe.jpg",
     "Una mujer amnésica y una actriz aspirante se unen en el misterioso Hollywood."),
    # MUSICAL
    ("Whiplash", 2014, "Musical", 107, "8.5", "7d_jQycdQGo",
     "https://m.media-amazon.com/images/M/MV5BOTA5NDZlZGUtMjAxOS00YTRkLTkwYmMtYWQ0NWEwZDZiNjEzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
     "Un joven baterista persigue la grandeza bajo la tutela de un instructor abusivo."),
    ("Bohemian Rhapsody", 2018, "Musical", 134, "7.9", "mP0VHJYFOAU",
     "https://m.media-amazon.com/images/M/MV5BNmExNjQwOWItYzQxYy00ZGQzLWFjZTktMWJlNGI5ZGI4NzQyXkEyXkFqcGdeQXVyNjY1MTg4Mzc@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/lHu1wtNaczFLHBtdCnqYdkHYqmV.jpg",
     "La historia del icónico vocalista de Queen, Freddie Mercury."),
    ("Chicago", 2002, "Musical", 113, "7.2", "8N_olmKlMFs",
     "https://m.media-amazon.com/images/M/MV5BNTJkMDc0MGQtMmFjYy00MmE4LTkwMjItNTc4NDMzNjYxNGYyXkEyXkFqcGdeQXVyNTIzOTk5ODM@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/dKAiDy5omlGoBUt99tLJlpMmOuv.jpg",
     "Dos asesinas compiten por fama y fortuna en el Chicago de los años 20."),
    ("Moulin Rouge!", 2001, "Musical", 127, "7.6", "wo8MaLnKOTQ",
     "https://m.media-amazon.com/images/M/MV5BNWZhMTQxMDktOTgxMS00OGZlLTlhNTMtMTFkNmI1N2IxZmUzXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/uKGCnkb6KxGb2XnNyDT6V90cBhm.jpg",
     "Un escritor se enamora de una bella cortesana en el París de 1900."),
    ("Elvis", 2022, "Musical", 159, "7.3", "6JGxQPUOWbk",
     "https://m.media-amazon.com/images/M/MV5BNTMzNjcxNjQ4Nl5BMl5BanBnXkFtZTgwMjQ3NDI1NzE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/6ApDtO7xaWAfnVsSx3r0kAvdYvs.jpg",
     "La vida del legendario Elvis Presley y su compleja relación con su representante."),
    # MYSTERY
    ("Glass Onion", 2022, "Mystery", 140, "7.1", "sVnmEFpB2A8",
     "https://m.media-amazon.com/images/M/MV5BOTllNjZjMzQtNzg3MC00ZGM5LWE5N2YtMGMzNTYzZjUxOTZjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg",
     "El detective Benoit Blanc investiga un misterio en una isla privada de un magnate."),
    ("The Prestige", 2006, "Mystery", 130, "8.5", "RLtaep-r7gk",
     "https://m.media-amazon.com/images/M/MV5BMjA4NDI0MTIxNF5BMl5BanBnXkFtZTYwNTM0MzY2._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/xxZ1GSYZ7AEzx3lDEBWn3SXIkGv.jpg",
     "Dos magos rivales se obsesionan mutuamente con consecuencias devastadoras."),
    ("Memento", 2000, "Mystery", 113, "8.4", "0vS0E9_ZoWk",
     "https://m.media-amazon.com/images/M/MV5BZTcyNjk1MjgtOWI3ZC00YzU0LWE0ZWQtMmJiNWVmNjM5YmM2XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg",
     "Un hombre con pérdida de memoria a corto plazo intenta encontrar al asesino de su esposa."),
    ("Prisoners", 2013, "Mystery", 153, "8.1", "5VBcKMB4t7s",
     "https://m.media-amazon.com/images/M/MV5BMTg0NTIzMjQ1NV5BMl5BanBnXkFtZTcwNDc3MzM5OQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/iMKHVvUjSAVNJFKEQCM3fqXEMjE.jpg",
     "Cuando desaparecen dos niñas, un desesperado padre toma la ley en sus manos."),
    ("The Girl with the Dragon Tattoo", 2011, "Mystery", 158, "7.8", "DqQe3OrsMKI",
     "https://m.media-amazon.com/images/M/MV5BMTkzNjk3MDkxOV5BMl5BanBnXkFtZTcwMjMxMTk1Ng@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/bahyBOYFwMpkJGm4BXeUXJOKaVS.jpg",
     "Un periodista y una hacker investigan la desaparición de una heredera hace 40 años."),
    # WAR
    ("Dunkirk", 2017, "War", 106, "7.9", "F-eMt3SrfFU",
     "https://m.media-amazon.com/images/M/MV5BN2YyZjQ0NTEtNzU5MS00NGZkLTg0MTEtYzJmZWQ3YzdkNmY1XkEyXkFqcGdeQXVyMDA4NzMyOA@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/cUqEgoP6kj8ykfNjJx3Tl5zHCcN.jpg",
     "La evacuación de soldados aliados en la playa de Dunkerque durante la Segunda Guerra Mundial."),
    ("1917", 2019, "War", 119, "8.3", "YqNYrYUiMfg",
     "https://m.media-amazon.com/images/M/MV5BOTdmNTFjNDEtNzE0My00ZTlmLTgxOWQtN2IxNGVlMjQ2OWJiXkEyXkFqcGdeQXVyNTAzNzgwNTg@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/au5RgNGq7LEKxqWDJHMJGi2LNzv.jpg",
     "Dos soldados son enviados en una carrera contra el tiempo para detener una emboscada masiva."),
    ("Hacksaw Ridge", 2016, "War", 139, "8.1", "s2-1hz1juBI",
     "https://m.media-amazon.com/images/M/MV5BMjQ1NjM3MTUxNV5BMl5BanBnXkFtZTgwMDc5MTY5OTE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/aCix6jxbFvPC6rKz7KP4nL0HMGU.jpg",
     "La historia de Desmond Doss, el primer objetor de conciencia en ganar la Medalla de Honor."),
    ("The Hurt Locker", 2008, "War", 131, "7.5", "RS_TFiXCsNY",
     "https://m.media-amazon.com/images/M/MV5BMTkyMjkzMzY0OF5BMl5BanBnXkFtZTcwNzc2MDkwMg@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/r6BRpLpFcCFQkEXP9LvtJ7LCNWM.jpg",
     "Un equipo de artificieros en Iraq arriesga su vida desactivando bombas."),
    ("Fury", 2014, "War", 134, "7.6", "2WjzGbSBSAo",
     "https://m.media-amazon.com/images/M/MV5BMjA0NjcyMTc1MV5BMl5BanBnXkFtZTgwNTgxNDk3MjE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/pfte7wdMobMF4CVHuOxyu6oqTen.jpg",
     "Un veterano sargento de tanques lidera una misión imposible en los últimos días de la Segunda Guerra Mundial."),
    # WESTERN
    ("Django Unchained", 2012, "Western", 165, "8.4", "eUdM9vrCbow",
     "https://m.media-amazon.com/images/M/MV5BMjIyNTQ5NjQ1OV5BMl5BanBnXkFtZTcwODg1MDU4OA@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/5WJnHnG6JgPa2OFcRJEfgMHqm8v.jpg",
     "Un esclavo liberado se alía con un cazarrecompensas para rescatar a su esposa."),
    ("True Grit", 2010, "Western", 110, "7.6", "B_yHgUMe1F4",
     "https://m.media-amazon.com/images/M/MV5BMjIxNDA4NTA1Nl5BMl5BanBnXkFtZTcwNTIzNDU4Mw@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/p0xHKtYGBFfA1VCLrDXPIGr4AJf.jpg",
     "Una joven valiente contrata a un viejo marshal para atrapar al asesino de su padre."),
    ("Hell or High Water", 2016, "Western", 102, "7.7", "B5dK-BkSloA",
     "https://m.media-amazon.com/images/M/MV5BMjMyODYzMDUxN15BMl5BanBnXkFtZTgwNzY1NjM2ODE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/ox4goZd956PiJJXFMoHMnMJ6ePx.jpg",
     "Dos hermanos roban bancos en Texas mientras un agente federal retirado los persigue."),
    ("The Hateful Eight", 2015, "Western", 187, "7.8", "89-bGquCmvE",
     "https://m.media-amazon.com/images/M/MV5BMjExNzA0NDM4NF5BMl5BanBnXkFtZTgwNjQwNzgyNTE@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/gY5hBCbNKOvSzZpO4KTYLHFzJCn.jpg",
     "Ocho desconocidos quedan atrapados en una cabaña durante una tormenta de nieve en Wyoming."),
    ("News of the World", 2020, "Western", 118, "6.9", "q2AVr4WNOP0",
     "https://m.media-amazon.com/images/M/MV5BYWQ5YTM3ZWQtMDAxZS00ZTQ3LWFjZjYtNjUzMjY4ODM4Zjc1XkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
     "https://image.tmdb.org/t/p/original/yGS3hLRrGHhFm3369UNiSMxHM0U.jpg",
     "Un ex soldado confederado transporta a una niña de regreso con su familia en Texas."),
]


class Command(BaseCommand):
    help = 'Seeds 35 movies for 7 empty genres: Children, Documentary, Film-Noir, Musical, Mystery, War, Western'

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

        self.stdout.write(self.style.SUCCESS(f'\n🎬 Done! Added {created} movies.'))
