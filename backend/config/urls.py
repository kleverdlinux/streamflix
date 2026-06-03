from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls_auth')),
    path('api/users/', include('apps.users.urls_users')),
    path('api/movies/', include('apps.movies.urls')),
    path('api/movies/', include('apps.ratings.urls')),  # /api/movies/{id}/rate/, /ratings/, /watch/
    path('api/genres/', include('apps.movies.urls_genres')),
    path('api/recommendations/', include('apps.recommendations.urls')),
    path('api/admin/', include('apps.admin_panel.urls')),
]
