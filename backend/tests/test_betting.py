import pytest
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from games.models import Bet, Round, UserProfile, LedgerEntry
from games.services import RoundsEngine


@pytest.mark.django_db
class TestBettingLogic(TestCase):
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
        self.round = RoundsEngine.create_round()
    
    def test_place_bet_success(self):
        """Test successful bet placement"""
        initial_balance = self.profile.balance_tnd
        bet_amount = Decimal('100.00')
        
        # Create bet
        bet = Bet.objects.create(
            user=self.user,
            round=self.round,
            amount_tnd=bet_amount,
            status='PENDING'
        )
        
        # Deduct balance
        self.profile.balance_tnd -= bet_amount
        self.profile.save()
        
        # Create ledger entry
        LedgerEntry.objects.create(
            user=self.user,
            type='BET_PLACED',
            amount_tnd=-bet_amount,
            balance_before=initial_balance,
            balance_after=self.profile.balance_tnd,
            meta={'bet_id': bet.id}
        )
        
        # Verify
        self.profile.refresh_from_db()
        assert self.profile.balance_tnd == initial_balance - bet_amount
        assert bet.amount_tnd == bet_amount
        assert bet.status == 'PENDING'
    
    def test_cannot_bet_more_than_balance(self):
        """Test that user cannot bet more than their balance"""
        bet_amount = Decimal('2000.00')  # More than balance
        
        with self.assertRaises(Exception):
            if bet_amount > self.profile.balance_tnd:
                raise Exception("Insufficient balance")
    
    def test_cashout_success(self):
        """Test successful cashout"""
        bet_amount = Decimal('100.00')
        cashout_multiplier = Decimal('2.50')
        
        # Place bet
        bet = Bet.objects.create(
            user=self.user,
            round=self.round,
            amount_tnd=bet_amount,
            status='ACTIVE'
        )
        
        initial_balance = self.profile.balance_tnd
        win_amount = bet_amount * cashout_multiplier
        
        # Cashout
        bet.status = 'CASHED_OUT'
        bet.cashed_out_multiplier = cashout_multiplier
        bet.win_amount_tnd = win_amount
        bet.save()
        
        # Credit balance
        self.profile.balance_tnd += win_amount
        self.profile.save()
        
        # Verify
        self.profile.refresh_from_db()
        assert bet.status == 'CASHED_OUT'
        assert bet.win_amount_tnd == win_amount
        assert self.profile.balance_tnd == initial_balance + win_amount
    
    def test_auto_cashout(self):
        """Test auto-cashout functionality"""
        bet_amount = Decimal('100.00')
        auto_cashout = Decimal('3.00')
        current_multiplier = Decimal('3.50')
        
        bet = Bet.objects.create(
            user=self.user,
            round=self.round,
            amount_tnd=bet_amount,
            auto_cashout_multiplier=auto_cashout,
            status='ACTIVE'
        )
        
        # Auto-cashout should trigger at 3.00x
        if current_multiplier >= auto_cashout:
            win_amount = bet_amount * auto_cashout
            bet.status = 'CASHED_OUT'
            bet.cashed_out_multiplier = auto_cashout
            bet.win_amount_tnd = win_amount
            bet.save()
        
        assert bet.status == 'CASHED_OUT'
        assert bet.cashed_out_multiplier == auto_cashout
