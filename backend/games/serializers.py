from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Bet, Round, LedgerEntry


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ['id', 'server_seed_hash', 'state', 'crash_multiplier', 'created_at']


class BetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    round = RoundSerializer(read_only=True)
    
    class Meta:
        model = Bet
        fields = [
            'id', 'user', 'round', 'amount_tnd', 'placed_at',
            'auto_cashout_multiplier', 'cashed_out_at',
            'cashed_out_multiplier', 'win_amount_tnd', 'status'
        ]
        read_only_fields = [
            'id', 'placed_at', 'cashed_out_at',
            'cashed_out_multiplier', 'win_amount_tnd', 'status'
        ]


class PlaceBetSerializer(serializers.Serializer):
    amount_tnd = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1.0)
    auto_cashout_multiplier = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False, 
        allow_null=True,
        min_value=1.01
    )
    idempotency_key = serializers.CharField(max_length=64, required=False, allow_null=True)
    
    def validate_amount_tnd(self, value):
        """Validate bet amount is within limits"""
        MIN_BET = 10.0
        MAX_BET = 10000.0
        
        if value < MIN_BET:
            raise serializers.ValidationError(f"Minimum bet is {MIN_BET} TND")
        if value > MAX_BET:
            raise serializers.ValidationError(f"Maximum bet is {MAX_BET} TND")
        
        return value


class CashoutSerializer(serializers.Serializer):
    current_multiplier = serializers.DecimalField(max_digits=10, decimal_places=2)


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'type', 'amount_tnd', 'balance_before',
            'balance_after', 'meta', 'timestamp'
        ]


class BalanceSerializer(serializers.Serializer):
    balance_tnd = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance_minor_units = serializers.IntegerField()
    crypto_equivalents = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
