import time
from django.core.management.base import BaseCommand
from django.db import connection
from slugify import slugify
from apps.movies.models import Movie, Genre

def _insert_movie_genre(movie_id, genre_id):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO movie_genres (movie_id, genre_id, is_primary)
            VALUES (%s, %s, TRUE)
            ON CONFLICT (movie_id, genre_id) DO NOTHING
            """,
            [movie_id, genre_id]
        )

class Command(BaseCommand):
    help = 'Seeds movies from a hardcoded premium list to avoid API blocks'

    def handle(self, *args, **options):
        # Premium hand-crafted dataset for StreamFlix (Bypasses all API blocks)
        movies_data = [
            # ACTION
            {"title": "Gladiator", "year": 2000, "genre": "Action", "desc": "Un general romano traicionado busca venganza contra el emperador corrupto que asesinó a su familia y lo envió a la esclavitud.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ty8TGRuvJLPUmAR1H1nRIsgwvq0.jpg"},
            {"title": "The Dark Knight", "year": 2008, "genre": "Action", "desc": "Batman se enfrenta a su mayor desafío psicológico y físico cuando el Joker desata el caos en Gotham City.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qJ2tW6WMUDux911r6m7haRef0WH.jpg"},
            {"title": "John Wick", "year": 2014, "genre": "Action", "desc": "Un ex asesino a sueldo sale de su retiro para cazar a los mafiosos que le quitaron todo lo que amaba.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/v5q2zK3XbYV70K0I9qG7p4rE9Yv.jpg"},
            
            # ADVENTURE
            {"title": "Interstellar", "year": 2014, "genre": "Adventure", "desc": "Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QlsEOWepvdIV6glMEeqO8M.jpg"},
            {"title": "Avatar", "year": 2009, "genre": "Adventure", "desc": "Un ex marine parapléjico es enviado a la luna Pandora en una misión única, pero se debate entre seguir órdenes y proteger el mundo que siente como su hogar.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg"},
            {"title": "Dune", "year": 2021, "genre": "Adventure", "desc": "Paul Atreides, un joven brillante, debe viajar al planeta más peligroso del universo para asegurar el futuro de su familia y su pueblo.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"},
            
            # ANIMATION
            {"title": "Spirited Away", "year": 2001, "genre": "Animation", "desc": "Durante la mudanza de su familia a los suburbios, una niña de 10 años deambula por un mundo gobernado por dioses y espíritus.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/39wmItIWsg5sZMyRU841LiyNhoq.jpg"},
            {"title": "Spider-Man: Into the Spider-Verse", "year": 2018, "genre": "Animation", "desc": "El adolescente Miles Morales se convierte en el Spider-Man de su universo y debe unirse a otros como él para detener una amenaza en todas las dimensiones.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"},
            {"title": "Coco", "year": 2017, "genre": "Animation", "desc": "El aspirante a músico Miguel, entra en la Tierra de los Muertos para encontrar a su bisabuelo, un cantante legendario.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gGEsBPAijhVMBepPJB2Ng001u4p.jpg"},
            
            # COMEDY
            {"title": "The Grand Budapest Hotel", "year": 2014, "genre": "Comedy", "desc": "Un legendario conserje de un famoso hotel europeo de entreguerras se hace amigo de un joven empleado que se convierte en su protegido de confianza.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/eWdyYQreja6JGCFGCK7iB1k9wL5.jpg"},
            {"title": "Knives Out", "year": 2019, "genre": "Comedy", "desc": "Un detective investiga la muerte del patriarca de una familia excéntrica y combativa.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pThyQovXQrw2m0s9x82twj48Jq4.jpg"},
            {"title": "Superbad", "year": 2007, "genre": "Comedy", "desc": "Dos adolescentes a punto de graduarse planean una fiesta épica para perder su virginidad antes de ir a la universidad.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kL2qZtT0R1bH62wS2y8B65dE8D.jpg"},

            # CRIME
            {"title": "The Departed", "year": 2006, "genre": "Crime", "desc": "Un policía encubierto y un topo en la policía intentan identificarse mutuamente mientras se infiltran en una pandilla irlandesa en Boston.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kS1J5BIf0U6j1JkYgNfC8Jt0t0F.jpg"},
            {"title": "Parasite", "year": 2019, "genre": "Crime", "desc": "La avaricia y la discriminación de clases amenazan la recién formada relación simbiótica entre la rica familia Park y el destituido clan Kim.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg"},
            {"title": "The Batman", "year": 2022, "genre": "Crime", "desc": "Cuando el Acertijo, un asesino en serie, comienza a asesinar a figuras políticas clave en Gotham, Batman se ve obligado a investigar la corrupción oculta de la ciudad.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/74xTEgt7R36Fpooo50r9T25onhq.jpg"},

            # DRAMA
            {"title": "The Shawshank Redemption", "year": 1994, "genre": "Drama", "desc": "Dos hombres encarcelados se hacen amigos a lo largo de los años, encontrando consuelo y redención final a través de actos de decencia común.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"},
            {"title": "Oppenheimer", "year": 2023, "genre": "Drama", "desc": "La historia del científico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"},
            {"title": "The Whale", "year": 2022, "genre": "Drama", "desc": "Un solitario profesor de inglés que sufre de obesidad severa intenta reconectarse con su hija adolescente en una última oportunidad de redención.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg"},

            # FANTASY
            {"title": "Harry Potter and the Sorcerer's Stone", "year": 2001, "genre": "Fantasy", "desc": "Un niño huérfano descubre que es un mago y es enviado a la Escuela de Magia y Hechicería de Hogwarts.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/wuMc08JTJVSJhpebR29rYAY4m8A.jpg"},
            {"title": "Pan's Labyrinth", "year": 2006, "genre": "Fantasy", "desc": "En la España posterior a la Guerra Civil, la hijastra de un oficial sádico del ejército explora un misterioso laberinto donde encuentra a una criatura mágica.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/2gN1fL7Oa2A1pQ4kE1z2jY5Vb2e.jpg"},
            {"title": "The Lord of the Rings: The Return of the King", "year": 2003, "genre": "Fantasy", "desc": "Gandalf y Aragorn lideran el Mundo de los Hombres contra el ejército de Sauron para desviar su mirada de Frodo y Sam.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"},

            # HORROR
            {"title": "Hereditary", "year": 2018, "genre": "Horror", "desc": "Una familia en duelo está atormentada por sucesos trágicos y perturbadores tras la muerte de su abuela secretista.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lHV8HHlhwNup2VbFJa6cEJU8hTw.jpg"},
            {"title": "A Quiet Place", "year": 2018, "genre": "Horror", "desc": "En un mundo post-apocalíptico, una familia debe vivir en silencio para esconderse de monstruos con oídos ultrasensibles.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/nAU74GmpUk7t5iklEp3bufwDq4n.jpg"},
            {"title": "Get Out", "year": 2017, "genre": "Horror", "desc": "Un joven afroamericano visita a la familia de su novia blanca, donde pronto se da cuenta del oscuro y perturbador secreto que esconden.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/tFXcEccSQAmRoIdcgGZhwCj11L.jpg"},

            # SCI-FI
            {"title": "Inception", "year": 2010, "genre": "Sci-Fi", "desc": "Un ladrón de sueños es contratado para la tarea más difícil de su vida: plantar una idea en el subconsciente del heredero de un imperio empresarial.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"},
            {"title": "Blade Runner 2049", "year": 2017, "genre": "Sci-Fi", "desc": "El descubrimiento de un secreto enterrado durante mucho tiempo lleva a un nuevo Blade Runner a rastrear al ex Blade Runner Rick Deckard, quien ha estado desaparecido durante treinta años.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg"},
            {"title": "Ex Machina", "year": 2014, "genre": "Sci-Fi", "desc": "Un joven programador es seleccionado para participar en un experimento de vanguardia en inteligencia artificial evaluando las cualidades humanas de una I.A. humanoide altamente avanzada.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/drjEERL83q4eM1V55O3nEpp867y.jpg"},

            # ROMANCE
            {"title": "La La Land", "year": 2016, "genre": "Romance", "desc": "Un pianista de jazz y una aspirante a actriz se enamoran mientras navegan por sus carreras en Los Ángeles, pero su éxito amenaza con separarlos.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uDO8zWDhfWwoFdKS4fzkUJt0f.jpg"},
            {"title": "Eternal Sunshine of the Spotless Mind", "year": 2004, "genre": "Romance", "desc": "Cuando su relación se vuelve amarga, una pareja se somete a un procedimiento médico para borrarse mutuamente de sus memorias para siempre.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/5MwkWH9tx75G6Bab690N6nHchEE.jpg"},
            {"title": "Pride & Prejudice", "year": 2005, "genre": "Romance", "desc": "La chispa vuela entre Elizabeth Bennet y el Sr. Darcy a medida que superan su propio orgullo y los prejuicios de su sociedad.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/sGjniLfvwFc60LpX9YdJ8nQ48T1.jpg"},

            # THRILLER
            {"title": "Gone Girl", "year": 2014, "genre": "Thriller", "desc": "Con el misterioso caso de la desaparición de su esposa en el ojo público, un hombre ve cómo los medios empiezan a enfocarse en él.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qymaJhucquUwjpb8oiqynMeXnWH.jpg"},
            {"title": "Shutter Island", "year": 2010, "genre": "Thriller", "desc": "Un alguacil de EE.UU. investiga la desaparición de una asesina que escapó de un hospital para delincuentes dementes.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kve20tXwUZpu4GUX8l6X7Z4jmL6.jpg"},
            {"title": "Tenet", "year": 2020, "genre": "Thriller", "desc": "Armado solo con una palabra, un agente viaja a través del mundo del espionaje internacional en una misión que se desarrollará en algo más allá del tiempo real.", "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/k68nPLbIST6NP96JmTxmZijEvCA.jpg"}
        ]

        genre_cache = {g.name.lower(): g for g in Genre.objects.all()}
        created_count = 0

        self.stdout.write(self.style.WARNING(f"Iniciando inyección local de {len(movies_data)} películas premium (Bypassing Apple Firewalls)..."))

        for idx, item in enumerate(movies_data):
            try:
                title = item["title"]
                slug = slugify(title)
                
                if Movie.objects.filter(slug=slug).exists():
                    self.stdout.write(self.style.WARNING(f"[{idx+1}/{len(movies_data)}] Ya existe: {title}"))
                    continue

                movie = Movie(
                    title=title,
                    title_original=title,
                    slug=slug,
                    year=item["year"],
                    duration_min=120,
                    description=item["desc"],
                    content_rating="PG-13",
                    poster_url=item["poster"],
                    backdrop_url=item["poster"], 
                    language="English",
                    country="USA",
                    weighted_rating=8.5,
                    avg_rating=8.5,
                    num_ratings=5000,
                    is_active=True
                )
                movie.save()

                # Insert Genre
                genre_name = item["genre"]
                genre_key = genre_name.lower()
                
                if genre_key not in genre_cache:
                    genre = Genre(name=genre_name, slug=slugify(genre_name))
                    genre.save()
                    genre_cache[genre_key] = genre
                    
                genre_obj = genre_cache[genre_key]
                _insert_movie_genre(movie.id, genre_obj.id)

                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[{idx+1}/{len(movies_data)}] Inyectada correctamente: {title} ({item['year']})"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error en {item['title']}: {str(e)}"))
                
        self.stdout.write(self.style.SUCCESS(f"\n✅ MIGRACION LOCAL COMPLETADA! Se inyectaron {created_count} películas espectaculares."))
