from django.urls import path
from . import views

urlpatterns = [
    path('', views.genre_list, name='genre-list'),
]
