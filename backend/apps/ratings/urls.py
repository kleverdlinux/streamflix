from django.urls import path
from . import views

urlpatterns = [
    path('<int:pk>/rate/', views.rate_movie, name='movie-rate'),
    path('<int:pk>/ratings/', views.movie_ratings, name='movie-ratings'),
    path('<int:pk>/watch/', views.watch_movie, name='movie-watch'),
]
