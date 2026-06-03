from django.contrib import admin
from .models import Movie, Genre, Person, MovieGenre, MoviePerson

class MovieGenreInline(admin.TabularInline):
    model = MovieGenre
    extra = 1

class MoviePersonInline(admin.TabularInline):
    model = MoviePerson
    extra = 1

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'year', 'weighted_rating', 'is_active')
    search_fields = ('title', 'id')
    list_filter = ('is_active', 'year')
    inlines = [MovieGenreInline, MoviePersonInline]

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name',)

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name')
    search_fields = ('full_name',)
