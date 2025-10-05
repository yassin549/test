from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Bet, Round, LedgerEntry, UserProfile
from .serializers import (
    BetSerializer, PlaceBetSerializer, CashoutSerializer,
    BalanceSerializer, LedgerEntrySerializer
)
from .services import RoundsEngine


class BetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bets
    """
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return bets for the current user"""
        return Bet.objects.filter(user=self.request.user).select_related('round')
    
    def create(self, request):
        """
        Place a new bet with atomic transaction
        """
        serializer = PlaceBetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        amount_tnd = serializer.validated_data['amount_tnd']
        auto_cashout = serializer.validated_data.get('auto_cashout_multiplier')
        idempotency_key = serializer.validated_data.get('idempotency_key')
        
        # Check for duplicate idempotency key
        if idempotency_key:
            existing_bet = Bet.objects.filter(
                user=request.user,
                meta__idempotency_key=idempotency_key
            ).first()
            if existing_bet:
                return Response(
                    BetSerializer(existing_bet).data,
                    status=status.HTTP_200_OK
                )
        
        try:
            with transaction.atomic():
                # Get or create user profile
                profile, _ = UserProfile.objects.select_for_update().get_or_create(
                    user=request.user
                )
                
                # Check balance
                if profile.balance_tnd < amount_tnd:
                    return Response(
                        {'error': 'Insufficient balance'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get current round
                current_round = RoundsEngine.get_current_round()
                
                # Can only bet during PRE_ROUND
                if current_round.state != 'PRE_ROUND':
                    return Response(
                        {'error': 'Cannot place bet during active round'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Deduct balance
                balance_before = profile.balance_tnd
                profile.balance_tnd -= amount_tnd
                profile.save()
                
                # Create bet
                bet = Bet.objects.create(
                    user=request.user,
                    round=current_round,
                    amount_tnd=amount_tnd,
                    auto_cashout_multiplier=auto_cashout,
                    status='PENDING'
                )
                
                # Create ledger entry
                LedgerEntry.objects.create(
                    user=request.user,
                    type='BET_PLACED',
                    amount_tnd=-amount_tnd,
                    balance_before=balance_before,
                    balance_after=profile.balance_tnd,
                    meta={
                        'bet_id': bet.id,
                        'round_id': current_round.id,
                        'idempotency_key': idempotency_key
                    }
                )
                
                # TODO: Emit WebSocket event for balance update
                
                return Response(
                    BetSerializer(bet).data,
                    status=status.HTTP_201_CREATED
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cashout(self, request, pk=None):
        """
        Cash out an active bet with atomic transaction
        """
        serializer = CashoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        current_multiplier = serializer.validated_data['current_multiplier']
        
        try:
            with transaction.atomic():
                # Get bet with lock
                bet = Bet.objects.select_for_update().select_related('round').get(
                    id=pk,
                    user=request.user
                )
                
                # Validate bet can be cashed out
                if bet.status != 'ACTIVE':
                    return Response(
                        {'error': f'Bet is not active (status: {bet.status})'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if bet.round.state != 'FLYING':
                    return Response(
                        {'error': 'Round is not in flying state'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate multiplier
                if current_multiplier > bet.round.crash_multiplier:
                    return Response(
                        {'error': 'Invalid multiplier (round has crashed)'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if already cashed out (idempotency)
                if bet.cashed_out_at:
                    return Response(
                        BetSerializer(bet).data,
                        status=status.HTTP_200_OK
                    )
                
                # Calculate payout
                win_amount = bet.amount_tnd * current_multiplier
                profit = win_amount - bet.amount_tnd
                
                # Get user profile
                profile = UserProfile.objects.select_for_update().get(user=request.user)
                balance_before = profile.balance_tnd
                
                # Credit balance
                profile.balance_tnd += win_amount
                profile.save()
                
                # Update bet
                bet.status = 'CASHED_OUT'
                bet.cashed_out_at = timezone.now()
                bet.cashed_out_multiplier = current_multiplier
                bet.win_amount_tnd = win_amount
                bet.save()
                
                # Create ledger entry
                LedgerEntry.objects.create(
                    user=request.user,
                    type='BET_WON',
                    amount_tnd=win_amount,
                    balance_before=balance_before,
                    balance_after=profile.balance_tnd,
                    meta={
                        'bet_id': bet.id,
                        'round_id': bet.round.id,
                        'multiplier': float(current_multiplier),
                        'profit': float(profit)
                    }
                )
                
                # TODO: Emit WebSocket event for balance update
                
                return Response(
                    BetSerializer(bet).data,
                    status=status.HTTP_200_OK
                )
                
        except Bet.DoesNotExist:
            return Response(
                {'error': 'Bet not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """
    Get user's current balance
    """
    try:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        balance_data = {
            'balance_tnd': profile.balance_tnd,
            'balance_minor_units': int(profile.balance_tnd * 100),
            'crypto_equivalents': []  # TODO: Add crypto conversion rates
        }
        
        serializer = BalanceSerializer(balance_data)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ledger(request):
    """
    Get user's ledger entries
    """
    try:
        entries = LedgerEntry.objects.filter(user=request.user).order_by('-timestamp')[:50]
        serializer = LedgerEntrySerializer(entries, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
