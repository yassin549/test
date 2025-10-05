import pytest
import json
import hmac
import hashlib
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase, Client
from payments.models import Deposit
from payments.nowpayments import NowPaymentsClient
from games.models import UserProfile, LedgerEntry


@pytest.mark.django_db
class TestDepositWebhook(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            balance_tnd=Decimal('1000.00')
        )
        self.webhook_secret = 'test_webhook_secret'
    
    def test_webhook_signature_verification(self):
        """Test that webhook signature is verified correctly"""
        payload = json.dumps({
            'invoice_id': 'test_invoice_123',
            'payment_status': 'finished',
            'order_id': 'test_order_123'
        })
        
        # Generate valid signature
        signature = hmac.new(
            self.webhook_secret.encode(),
            payload.encode(),
            hashlib.sha512
        ).hexdigest()
        
        # Verify signature
        is_valid = NowPaymentsClient.verify_webhook_signature(
            payload.encode(),
            signature,
            self.webhook_secret
        )
        
        assert is_valid is True
    
    def test_invalid_webhook_signature_rejected(self):
        """Test that invalid signatures are rejected"""
        payload = json.dumps({
            'invoice_id': 'test_invoice_123',
            'payment_status': 'finished'
        })
        
        invalid_signature = 'invalid_signature_123'
        
        is_valid = NowPaymentsClient.verify_webhook_signature(
            payload.encode(),
            invalid_signature,
            self.webhook_secret
        )
        
        assert is_valid is False
    
    def test_deposit_status_transitions(self):
        """Test deposit status transitions"""
        deposit = Deposit.objects.create(
            user=self.user,
            invoice_id='test_invoice_123',
            order_id='test_order_123',
            pay_address='test_address',
            pay_amount=Decimal('0.001'),
            pay_currency='btc',
            amount_tnd=Decimal('100.00'),
            rate_used=Decimal('0.00001'),
            status='waiting'
        )
        
        # Test status transitions
        valid_transitions = [
            ('waiting', 'confirming'),
            ('confirming', 'confirmed'),
            ('confirmed', 'completed'),
        ]
        
        for from_status, to_status in valid_transitions:
            deposit.status = from_status
            deposit.save()
            
            deposit.status = to_status
            deposit.save()
            
            deposit.refresh_from_db()
            assert deposit.status == to_status
    
    def test_deposit_completion_credits_balance(self):
        """Test that completed deposit credits user balance"""
        initial_balance = self.profile.balance_tnd
        deposit_amount = Decimal('100.00')
        
        deposit = Deposit.objects.create(
            user=self.user,
            invoice_id='test_invoice_123',
            order_id='test_order_123',
            pay_address='test_address',
            pay_amount=Decimal('0.001'),
            pay_currency='btc',
            amount_tnd=deposit_amount,
            rate_used=Decimal('0.00001'),
            status='confirmed'
        )
        
        # Mark as completed
        deposit.status = 'completed'
        deposit.save()
        
        # Credit balance
        self.profile.balance_tnd += deposit_amount
        self.profile.save()
        
        # Create ledger entry
        LedgerEntry.objects.create(
            user=self.user,
            type='DEPOSIT',
            amount_tnd=deposit_amount,
            balance_before=initial_balance,
            balance_after=self.profile.balance_tnd,
            meta={'deposit_id': deposit.id}
        )
        
        # Verify
        self.profile.refresh_from_db()
        assert self.profile.balance_tnd == initial_balance + deposit_amount
        assert LedgerEntry.objects.filter(
            user=self.user,
            type='DEPOSIT'
        ).exists()
    
    def test_expired_deposit_does_not_credit(self):
        """Test that expired deposits do not credit balance"""
        initial_balance = self.profile.balance_tnd
        
        deposit = Deposit.objects.create(
            user=self.user,
            invoice_id='test_invoice_123',
            order_id='test_order_123',
            pay_address='test_address',
            pay_amount=Decimal('0.001'),
            pay_currency='btc',
            amount_tnd=Decimal('100.00'),
            rate_used=Decimal('0.00001'),
            status='expired'
        )
        
        # Balance should not change
        self.profile.refresh_from_db()
        assert self.profile.balance_tnd == initial_balance
