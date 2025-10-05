from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BetViewSet, get_balance, get_ledger

router = DefaultRouter()
router.register(r'bets', BetViewSet, basename='bet')

urlpatterns = [
    path('', include(router.urls)),
    path('balance/', get_balance, name='balance'),
    path('ledger/', get_ledger, name='ledger'),
]
