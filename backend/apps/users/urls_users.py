from django.urls import path
from . import views

urlpatterns = [
    path('<int:user_id>/watchlist/', views.watchlist, name='user-watchlist'),
    path('<int:user_id>/watchlist/<int:movie_id>/', views.watchlist_remove, name='user-watchlist-remove'),
    path('<int:user_id>/history/', views.history, name='user-history'),
    path('<int:user_id>/preferences/', views.preferences, name='user-preferences'),
    path('<int:user_id>/stats/', views.user_stats, name='user-stats'),
]
