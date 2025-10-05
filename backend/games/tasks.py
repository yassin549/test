from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Bet, Round, LedgerEntry, UserProfile


def settle_round_bets(round_id):
    """
    Settle all outstanding bets for a crashed round
    This should be called as a background task when a round crashes
    """
    try:
        with transaction.atomic():
            round_obj = Round.objects.select_for_update().get(id=round_id)
            
            if round_obj.state != 'CRASHED':
                return {'error': 'Round is not in crashed state'}
            
            # Get all active bets for this round
            active_bets = Bet.objects.select_for_update().filter(
                round=round_obj,
                status='ACTIVE'
            ).select_related('user')
            
            settled_count = 0
            
            for bet in active_bets:
                # These bets didn't cash out in time - they lose
                bet.status = 'LOST'
                bet.save()
                
                # Create ledger entry for the loss
                profile = UserProfile.objects.get(user=bet.user)
                LedgerEntry.objects.create(
                    user=bet.user,
                    type='BET_LOST',
                    amount_tnd=Decimal('0.00'),  # No payout
                    balance_before=profile.balance_tnd,
                    balance_after=profile.balance_tnd,  # Balance unchanged (already deducted)
                    meta={
                        'bet_id': bet.id,
                        'round_id': round_obj.id,
                        'crash_multiplier': float(round_obj.crash_multiplier)
                    }
                )
                
                settled_count += 1
            
            return {
                'success': True,
                'round_id': round_id,
                'settled_count': settled_count
            }
            
    except Round.DoesNotExist:
        return {'error': f'Round {round_id} not found'}
    except Exception as e:
        return {'error': str(e)}


def activate_round_bets(round_id):
    """
    Activate all pending bets when a round starts flying
    """
    try:
        with transaction.atomic():
            round_obj = Round.objects.select_for_update().get(id=round_id)
            
            if round_obj.state != 'FLYING':
                return {'error': 'Round is not in flying state'}
            
            # Activate all pending bets
            activated_count = Bet.objects.filter(
                round=round_obj,
                status='PENDING'
            ).update(status='ACTIVE')
            
            return {
                'success': True,
                'round_id': round_id,
                'activated_count': activated_count
            }
            
    except Round.DoesNotExist:
        return {'error': f'Round {round_id} not found'}
    except Exception as e:
        return {'error': str(e)}


def process_auto_cashouts(round_id, current_multiplier):
    """
    Process auto-cashout for bets that have reached their target multiplier
    """
    try:
        with transaction.atomic():
            round_obj = Round.objects.get(id=round_id)
            
            if round_obj.state != 'FLYING':
                return {'error': 'Round is not in flying state'}
            
            # Find bets with auto-cashout at or below current multiplier
            auto_cashout_bets = Bet.objects.select_for_update().filter(
                round=round_obj,
                status='ACTIVE',
                auto_cashout_multiplier__lte=current_multiplier,
                auto_cashout_multiplier__isnull=False
            ).select_related('user')
            
            cashed_out_count = 0
            
            for bet in auto_cashout_bets:
                # Calculate payout at auto-cashout multiplier
                cashout_multiplier = bet.auto_cashout_multiplier
                win_amount = bet.amount_tnd * cashout_multiplier
                
                # Get user profile
                profile = UserProfile.objects.select_for_update().get(user=bet.user)
                balance_before = profile.balance_tnd
                
                # Credit balance
                profile.balance_tnd += win_amount
                profile.save()
                
                # Update bet
                bet.status = 'CASHED_OUT'
                bet.cashed_out_at = timezone.now()
                bet.cashed_out_multiplier = cashout_multiplier
                bet.win_amount_tnd = win_amount
                bet.save()
                
                # Create ledger entry
                LedgerEntry.objects.create(
                    user=bet.user,
                    type='BET_WON',
                    amount_tnd=win_amount,
                    balance_before=balance_before,
                    balance_after=profile.balance_tnd,
                    meta={
                        'bet_id': bet.id,
                        'round_id': round_obj.id,
                        'multiplier': float(cashout_multiplier),
                        'auto_cashout': True
                    }
                )
                
                cashed_out_count += 1
            
            return {
                'success': True,
                'round_id': round_id,
                'cashed_out_count': cashed_out_count
            }
            
    except Round.DoesNotExist:
        return {'error': f'Round {round_id} not found'}
    except Exception as e:
        return {'error': str(e)}
