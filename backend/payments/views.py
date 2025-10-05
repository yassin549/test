from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import uuid
import json
from .models import Deposit
from .serializers import CreateDepositSerializer, DepositSerializer
from .nowpayments import get_nowpayments_client, NowPaymentsClient
from games.models import UserProfile, LedgerEntry


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_deposit(request):
    """
    Create a new deposit invoice
    """
    serializer = CreateDepositSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    amount_tnd = serializer.validated_data['amount_tnd']
    pay_currency = serializer.validated_data['pay_currency']
    
    try:
        # Get NowPayments client
        client = get_nowpayments_client()
        
        # Generate unique order ID
        order_id = f"deposit_{request.user.id}_{uuid.uuid4().hex[:8]}"
        
        # Get estimate for conversion
        estimate = client.get_estimate(
            amount=amount_tnd,
            currency_from='usd',  # Using USD as proxy for TND
            currency_to=pay_currency
        )
        
        pay_amount = Decimal(str(estimate.get('estimated_amount', 0)))
        
        # Create invoice with NowPayments
        webhook_url = f"{settings.FRONTEND_URL}/api/deposits/webhook/"
        
        invoice = client.create_invoice(
            price_amount=amount_tnd,
            price_currency='USD',  # NowPayments uses USD
            pay_currency=pay_currency,
            order_id=order_id,
            order_description=f"Aviator deposit for {request.user.username}",
            ipn_callback_url=webhook_url
        )
        
        # Calculate expiry (typically 1 hour)
        expires_at = timezone.now() + timezone.timedelta(hours=1)
        
        # Create deposit record
        with transaction.atomic():
            deposit = Deposit.objects.create(
                user=request.user,
                invoice_id=invoice.get('id', ''),
                order_id=order_id,
                pay_address=invoice.get('pay_address', ''),
                pay_amount=pay_amount,
                pay_currency=pay_currency,
                amount_tnd=amount_tnd,
                rate_used=pay_amount / amount_tnd if amount_tnd > 0 else Decimal('0'),
                status='waiting',
                required_confirmations=invoice.get('required_confirmations', 1),
                expires_at=expires_at,
                meta={
                    'invoice_url': invoice.get('invoice_url', ''),
                    'network': invoice.get('network', ''),
                }
            )
        
        return Response(
            DepositSerializer(deposit).data,
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response(
            {'error': f'Failed to create deposit: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_deposit(request, deposit_id):
    """
    Get deposit status
    """
    try:
        deposit = Deposit.objects.get(id=deposit_id, user=request.user)
        return Response(DepositSerializer(deposit).data)
    except Deposit.DoesNotExist:
        return Response(
            {'error': 'Deposit not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def deposit_webhook(request):
    """
    Handle NowPayments webhook
    """
    try:
        # Get signature from headers
        signature = request.headers.get('x-nowpayments-sig', '')
        
        if not signature:
            return Response(
                {'error': 'Missing signature'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify signature
        webhook_secret = getattr(settings, 'NOWPAYMENTS_WEBHOOK_SECRET', '')
        payload = request.body
        
        if not NowPaymentsClient.verify_webhook_signature(payload, signature, webhook_secret):
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Parse webhook data
        data = json.loads(payload.decode('utf-8'))
        
        invoice_id = data.get('invoice_id')
        payment_status = data.get('payment_status', '').lower()
        order_id = data.get('order_id')
        
        if not invoice_id:
            return Response(
                {'error': 'Missing invoice_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get deposit
        try:
            deposit = Deposit.objects.select_for_update().get(invoice_id=invoice_id)
        except Deposit.DoesNotExist:
            return Response(
                {'error': 'Deposit not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Map NowPayments status to our status
        status_mapping = {
            'waiting': 'waiting',
            'confirming': 'confirming',
            'confirmed': 'confirmed',
            'sending': 'confirmed',
            'finished': 'completed',
            'failed': 'failed',
            'refunded': 'failed',
            'expired': 'expired',
        }
        
        new_status = status_mapping.get(payment_status, deposit.status)
        
        with transaction.atomic():
            # Update deposit status
            deposit.status = new_status
            deposit.current_confirmations = data.get('confirmations', 0)
            
            # If completed, credit user balance
            if new_status == 'completed' and deposit.status != 'completed':
                deposit.completed_at = timezone.now()
                
                # Get user profile
                profile = UserProfile.objects.select_for_update().get(user=deposit.user)
                balance_before = profile.balance_tnd
                
                # Credit balance
                profile.balance_tnd += deposit.amount_tnd
                profile.save()
                
                # Create ledger entry
                LedgerEntry.objects.create(
                    user=deposit.user,
                    type='DEPOSIT',
                    amount_tnd=deposit.amount_tnd,
                    balance_before=balance_before,
                    balance_after=profile.balance_tnd,
                    meta={
                        'deposit_id': deposit.id,
                        'invoice_id': invoice_id,
                        'pay_currency': deposit.pay_currency,
                        'pay_amount': float(deposit.pay_amount),
                    }
                )
                
                # TODO: Emit WebSocket event for balance update
            
            deposit.save()
        
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_deposits(request):
    """
    List user's deposits
    """
    deposits = Deposit.objects.filter(user=request.user).order_by('-created_at')[:20]
    return Response(DepositSerializer(deposits, many=True).data)
