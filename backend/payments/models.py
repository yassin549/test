from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class Deposit(models.Model):
    """
    Represents a deposit transaction via NowPayments
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('waiting', 'Waiting for Payment'),
        ('confirming', 'Confirming'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deposits')
    
    # Invoice details
    invoice_id = models.CharField(max_length=255, unique=True)
    order_id = models.CharField(max_length=255, unique=True)
    
    # Payment details
    pay_address = models.CharField(max_length=255)
    pay_amount = models.DecimalField(max_digits=20, decimal_places=8)
    pay_currency = models.CharField(max_length=10)
    
    # Fiat amount
    amount_tnd = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Exchange rate used
    rate_used = models.DecimalField(max_digits=20, decimal_places=8)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Confirmations
    required_confirmations = models.IntegerField(default=1)
    current_confirmations = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional data
    meta = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['invoice_id']),
            models.Index(fields=['order_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Deposit {self.id} - {self.user.username} - {self.amount_tnd} TND ({self.status})"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def confirmation_progress(self):
        if self.required_confirmations == 0:
            return 100
        return min(100, (self.current_confirmations / self.required_confirmations) * 100)


class PayoutRequest(models.Model):
    """
    Represents a user's payout/withdrawal request
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    METHOD_CHOICES = [
        ('crypto', 'Cryptocurrency'),
        ('bank', 'Bank Transfer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payout_requests')
    
    # Amount
    amount_tnd = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Method and destination
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    destination = models.TextField()  # Crypto address or bank details
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Notes
    user_note = models.TextField(blank=True)
    admin_note = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Admin tracking
    processed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='processed_payouts'
    )
    
    # Additional data
    meta = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"Payout {self.id} - {self.user.username} - {self.amount_tnd} TND ({self.status})"
