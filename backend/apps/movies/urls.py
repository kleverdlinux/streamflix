from django.urls import path
from . import views

urlpatterns = [
    path('', views.movie_list, name='movie-list'),
    path('trending/', views.trending, name='movie-trending'),
    path('new/', views.new_movies, name='movie-new'),
    path('originals/', views.originals, name='movie-originals'),
    path('by-genre/<slug:genre_slug>/', views.by_genre, name='movie-by-genre'),
    path('<int:pk>/', views.movie_detail, name='movie-detail'),
    path('<int:pk>/similar/', views.similar_movies, name='movie-similar'),
]
