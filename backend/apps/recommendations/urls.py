from django.urls import path
from . import views

urlpatterns = [
    path('', views.recommendation_list, name='recommendation-list'),
    path('similar/<int:movie_id>/', views.similar_movies, name='recommendation-similar'),
    path('match-score/<int:movie_id>/', views.match_score, name='recommendation-match-score'),
]
