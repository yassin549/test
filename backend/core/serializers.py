from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from games.models import UserProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        
        # Create user profile with initial demo balance
        UserProfile.objects.create(
            user=user,
            balance_tnd=5000.00  # Initial demo balance
        )
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'first_name', 'last_name', 'balance_tnd', 'created_at', 'date_joined']


class UserStatsSerializer(serializers.Serializer):
    total_bets = serializers.IntegerField()
    total_wagered = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_won = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=10, decimal_places=2)
    win_rate = serializers.FloatField()
    biggest_win = serializers.DecimalField(max_digits=10, decimal_places=2)
    biggest_multiplier = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_bet = serializers.DecimalField(max_digits=10, decimal_places=2)
    current_streak = serializers.IntegerField()
    best_streak = serializers.IntegerField()
