from django.core.management.base import BaseCommand
from django.db import connection
from apps.movies.models import Genre

GENRE_TRANSLATIONS = {
    "Action": "Acción",
    "Adventure": "Aventura",
    "Animation": "Animación",
    "Children's": "Infantil",
    "Comedy": "Comedia",
    "Crime": "Crimen",
    "Documentary": "Documental",
    "Drama": "Drama",
    "Fantasy": "Fantasía",
    "Film-Noir": "Cine Negro",
    "Horror": "Terror",
    "Musical": "Musical",
    "Mystery": "Misterio",
    "Romance": "Romance",
    "Sci-Fi": "Ciencia Ficción",
    "Thriller": "Suspenso",
    "War": "Guerra",
    "Western": "Viejo Oeste",
}

class Command(BaseCommand):
    help = 'Traduce los nombres de los géneros al español directamente en la base de datos.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("🌍 Traduciendo géneros al español..."))
        
        updated_count = 0
        for english, spanish in GENRE_TRANSLATIONS.items():
            # Actualizamos directamente usando Raw SQL por si el ORM falla
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE genres SET name = %s WHERE name = %s",
                    [spanish, english]
                )
                if cursor.rowcount > 0:
                    updated_count += cursor.rowcount
                    self.stdout.write(self.style.SUCCESS(f"✅ {english} -> {spanish}"))
                    
        # También actualizamos por el modelo ORM por si acaso la tabla se llama diferente
        for english, spanish in GENRE_TRANSLATIONS.items():
            genres = Genre.objects.filter(name=english)
            for g in genres:
                g.name = spanish
                g.save()
                
        self.stdout.write(self.style.SUCCESS(f"\n🎉 ¡Traducción completada!"))
