from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Sum, Count, Avg, Max, Q
from decimal import Decimal
from games.models import Bet, UserProfile
from .serializers import UserRegistrationSerializer, UserProfileSerializer, UserStatsSerializer


class HealthCheckView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login user
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Get user profile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'balance_tnd': float(profile.balance_tnd),
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        },
        'message': f'Welcome back, {user.username}!'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Get user profile
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response(
            {'error': 'Profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request):
    """
    Get user statistics
    """
    user = request.user
    
    # Get all bets
    all_bets = Bet.objects.filter(user=user)
    
    # Calculate statistics
    total_bets = all_bets.count()
    
    if total_bets == 0:
        # Return empty stats for new users
        stats = {
            'total_bets': 0,
            'total_wagered': Decimal('0.00'),
            'total_won': Decimal('0.00'),
            'total_profit': Decimal('0.00'),
            'win_rate': 0.0,
            'biggest_win': Decimal('0.00'),
            'biggest_multiplier': Decimal('0.00'),
            'average_bet': Decimal('0.00'),
            'current_streak': 0,
            'best_streak': 0,
        }
    else:
        # Total wagered
        total_wagered = all_bets.aggregate(Sum('amount_tnd'))['amount_tnd__sum'] or Decimal('0.00')
        
        # Total won (only cashed out bets)
        won_bets = all_bets.filter(status='CASHED_OUT')
        total_won = won_bets.aggregate(Sum('win_amount_tnd'))['win_amount_tnd__sum'] or Decimal('0.00')
        
        # Profit/Loss
        total_profit = total_won - total_wagered
        
        # Win rate
        wins = won_bets.count()
        win_rate = (wins / total_bets * 100) if total_bets > 0 else 0.0
        
        # Biggest win
        biggest_win = won_bets.aggregate(Max('win_amount_tnd'))['win_amount_tnd__max'] or Decimal('0.00')
        
        # Biggest multiplier
        biggest_multiplier = won_bets.aggregate(Max('cashed_out_multiplier'))['cashed_out_multiplier__max'] or Decimal('0.00')
        
        # Average bet
        average_bet = all_bets.aggregate(Avg('amount_tnd'))['amount_tnd__avg'] or Decimal('0.00')
        
        # Calculate streaks
        recent_bets = all_bets.order_by('-placed_at')[:50]
        current_streak = 0
        best_streak = 0
        temp_streak = 0
        
        for bet in recent_bets:
            if bet.status == 'CASHED_OUT':
                temp_streak += 1
                best_streak = max(best_streak, temp_streak)
                if current_streak == 0:  # First streak we encounter is current
                    current_streak = temp_streak
            else:
                if current_streak == 0:  # Still looking for current streak
                    current_streak = temp_streak
                temp_streak = 0
        
        stats = {
            'total_bets': total_bets,
            'total_wagered': total_wagered,
            'total_won': total_won,
            'total_profit': total_profit,
            'win_rate': round(win_rate, 2),
            'biggest_win': biggest_win,
            'biggest_multiplier': biggest_multiplier,
            'average_bet': average_bet,
            'current_streak': current_streak,
            'best_streak': best_streak,
        }
    
    serializer = UserStatsSerializer(stats)
    return Response(serializer.data)

