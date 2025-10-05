from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class UserProfile(models.Model):
    """
    Extended user profile with balance tracking
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    balance_tnd = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.balance_tnd} TND"


class Round(models.Model):
    """
    Represents a game round with provably-fair mechanics
    """
    STATE_CHOICES = [
        ('PRE_ROUND', 'Pre-round'),
        ('FLYING', 'Flying'),
        ('CRASHED', 'Crashed'),
    ]

    id = models.AutoField(primary_key=True)
    server_seed_hash = models.CharField(max_length=64, help_text="HMAC-SHA256 hash of server seed")
    server_seed_revealed = models.CharField(max_length=64, null=True, blank=True, help_text="Revealed after crash")
    start_time = models.DateTimeField(null=True, blank=True)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='PRE_ROUND')
    crash_multiplier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['state']),
        ]

    def __str__(self):
        return f"Round {self.id} - {self.state} - {self.crash_multiplier}x"


class Bet(models.Model):
    """
    Represents a user's bet on a round
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('CASHED_OUT', 'Cashed Out'),
        ('LOST', 'Lost'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bets')
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='bets')
    amount_tnd = models.DecimalField(max_digits=10, decimal_places=2)
    placed_at = models.DateTimeField(auto_now_add=True)
    auto_cashout_multiplier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cashed_out_at = models.DateTimeField(null=True, blank=True)
    cashed_out_multiplier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    win_amount_tnd = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-placed_at']
        indexes = [
            models.Index(fields=['user', '-placed_at']),
            models.Index(fields=['round', 'status']),
        ]

    def __str__(self):
        return f"Bet {self.id} - {self.user.username} - {self.amount_tnd} TND"


class LedgerEntry(models.Model):
    """
    Immutable ledger for all balance changes
    """
    TYPE_CHOICES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('BET_PLACED', 'Bet Placed'),
        ('BET_WON', 'Bet Won'),
        ('BET_LOST', 'Bet Lost'),
        ('REFUND', 'Refund'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ledger_entries')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount_tnd = models.DecimalField(max_digits=10, decimal_places=2)
    balance_before = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    meta = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.type} - {self.user.username} - {self.amount_tnd} TND"
