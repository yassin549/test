from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HealthCheckView, register, login, get_profile, get_stats

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', get_profile, name='profile'),
    path('stats/', get_stats, name='stats'),
]
