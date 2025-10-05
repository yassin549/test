from rest_framework import serializers
from .models import Deposit, PayoutRequest
from games.models import LedgerEntry


class CreateDepositSerializer(serializers.Serializer):
    amount_tnd = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=10.0)
    pay_currency = serializers.CharField(max_length=10)
    
    def validate_amount_tnd(self, value):
        """Validate minimum deposit amount"""
        MIN_DEPOSIT = 10.0
        if value < MIN_DEPOSIT:
            raise serializers.ValidationError(f"Minimum deposit is {MIN_DEPOSIT} TND")
        return value
    
    def validate_pay_currency(self, value):
        """Validate cryptocurrency"""
        SUPPORTED_CURRENCIES = ['btc', 'eth', 'usdt', 'ltc', 'trx']
        if value.lower() not in SUPPORTED_CURRENCIES:
            raise serializers.ValidationError(f"Unsupported currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}")
        return value.lower()


class DepositSerializer(serializers.ModelSerializer):
    confirmation_progress = serializers.FloatField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Deposit
        fields = [
            'id', 'invoice_id', 'order_id', 'pay_address', 'pay_amount',
            'pay_currency', 'amount_tnd', 'rate_used', 'status',
            'required_confirmations', 'current_confirmations',
            'confirmation_progress', 'created_at', 'expires_at',
            'completed_at', 'is_expired'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
