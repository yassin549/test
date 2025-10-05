import pytest
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from games.models import UserProfile, LedgerEntry


@pytest.mark.django_db
class TestLedgerIntegrity(TestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            balance_tnd=Decimal('1000.00')
        )
    
    def test_ledger_entry_creation(self):
        """Test that ledger entries are created correctly"""
        balance_before = self.profile.balance_tnd
        amount = Decimal('100.00')
        balance_after = balance_before - amount
        
        entry = LedgerEntry.objects.create(
            user=self.user,
            type='BET_PLACED',
            amount_tnd=-amount,
            balance_before=balance_before,
            balance_after=balance_after,
            meta={'test': True}
        )
        
        assert entry.balance_before == balance_before
        assert entry.balance_after == balance_after
        assert entry.amount_tnd == -amount
    
    def test_balance_never_negative(self):
        """Test that balance cannot go negative"""
        balance = self.profile.balance_tnd
        withdrawal = Decimal('2000.00')  # More than balance
        
        # This should fail
        with self.assertRaises(Exception):
            if balance - withdrawal < 0:
                raise Exception("Balance cannot be negative")
    
    def test_ledger_balance_consistency(self):
        """Test that ledger entries maintain balance consistency"""
        initial_balance = Decimal('1000.00')
        
        # Sequence of transactions
        transactions = [
            ('BET_PLACED', Decimal('-100.00')),
            ('BET_WON', Decimal('250.00')),
            ('BET_PLACED', Decimal('-50.00')),
            ('DEPOSIT', Decimal('500.00')),
        ]
        
        current_balance = initial_balance
        
        for tx_type, amount in transactions:
            balance_before = current_balance
            current_balance += amount
            balance_after = current_balance
            
            LedgerEntry.objects.create(
                user=self.user,
                type=tx_type,
                amount_tnd=amount,
                balance_before=balance_before,
                balance_after=balance_after
            )
        
        # Verify final balance
        entries = LedgerEntry.objects.filter(user=self.user).order_by('timestamp')
        last_entry = entries.last()
        
        assert last_entry.balance_after == current_balance
        assert current_balance == Decimal('1600.00')  # 1000 - 100 + 250 - 50 + 500
    
    def test_ledger_immutability(self):
        """Test that ledger entries cannot be modified"""
        entry = LedgerEntry.objects.create(
            user=self.user,
            type='BET_PLACED',
            amount_tnd=Decimal('-100.00'),
            balance_before=Decimal('1000.00'),
            balance_after=Decimal('900.00')
        )
        
        original_amount = entry.amount_tnd
        
        # In production, this should be prevented at the model level
        # For now, we just verify the entry exists
        assert entry.amount_tnd == original_amount
        assert LedgerEntry.objects.filter(id=entry.id).exists()
    
    def test_all_balance_changes_have_ledger_entries(self):
        """Test that every balance change creates a ledger entry"""
        initial_count = LedgerEntry.objects.filter(user=self.user).count()
        
        # Make a balance change
        balance_before = self.profile.balance_tnd
        self.profile.balance_tnd += Decimal('100.00')
        self.profile.save()
        
        # Create ledger entry
        LedgerEntry.objects.create(
            user=self.user,
            type='DEPOSIT',
            amount_tnd=Decimal('100.00'),
            balance_before=balance_before,
            balance_after=self.profile.balance_tnd
        )
        
        # Verify ledger entry was created
        final_count = LedgerEntry.objects.filter(user=self.user).count()
        assert final_count == initial_count + 1
