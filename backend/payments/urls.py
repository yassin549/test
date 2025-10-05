from django.urls import path
from .views import create_deposit, get_deposit, deposit_webhook, list_deposits

urlpatterns = [
    path('create/', create_deposit, name='create-deposit'),
    path('webhook/', deposit_webhook, name='deposit-webhook'),
    path('list/', list_deposits, name='list-deposits'),
    path('<int:deposit_id>/', get_deposit, name='get-deposit'),
]
