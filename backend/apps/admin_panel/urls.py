from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard, name='admin-dashboard'),
    path('users/', views.admin_users_list, name='admin-users'),
    path('users/<int:pk>/', views.admin_user_detail, name='admin-user-detail'),
    path('movies/', views.admin_movies_list, name='admin-movies'),
    path('movies/<int:pk>/', views.admin_movie_detail, name='admin-movie-detail'),
    path('metrics/', views.metrics, name='admin-metrics'),
    path('logs/', views.admin_logs, name='admin-logs'),
]
