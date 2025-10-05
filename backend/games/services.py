import hashlib
import hmac
import secrets
import time
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Round


class RoundsEngine:
    """
    Server-driven rounds engine with provably-fair mechanics
    """
    
    # Server secret for HMAC (should be in environment variables in production)
    SERVER_SECRET = "aviator_server_secret_key_change_in_production"
    
    # Round timing
    PRE_ROUND_DURATION = 10  # seconds
    MAX_ROUND_DURATION = 30  # seconds
    
    @staticmethod
    def generate_server_seed():
        """Generate a cryptographically secure random seed"""
        return secrets.token_hex(32)
    
    @staticmethod
    def compute_hash(server_seed: str) -> str:
        """Compute HMAC-SHA256 hash of server seed"""
        return hmac.new(
            RoundsEngine.SERVER_SECRET.encode(),
            server_seed.encode(),
            hashlib.sha256
        ).hexdigest()
    
    @staticmethod
    def compute_crash_multiplier(server_seed: str, client_salt: str = "default") -> Decimal:
        """
        Compute crash multiplier from server seed and client salt
        This is deterministic and reproducible for provably-fair verification
        """
        # Combine server seed and client salt
        combined = f"{server_seed}:{client_salt}"
        
        # Generate hash
        hash_value = hashlib.sha256(combined.encode()).hexdigest()
        
        # Convert first 8 hex characters to integer
        hex_int = int(hash_value[:8], 16)
        
        # Normalize to 0-1 range
        normalized = hex_int / 0xFFFFFFFF
        
        # Apply house edge and generate crash point
        # Using inverse exponential distribution for realistic crash points
        house_edge = 0.03  # 3% house edge
        
        if normalized == 0:
            normalized = 0.0001
        
        # Calculate crash point with house edge
        crash_point = (1 - house_edge) / (1 - normalized)
        
        # Clamp between 1.00x and 100.00x
        crash_point = max(1.00, min(100.00, crash_point))
        
        return Decimal(str(round(crash_point, 2)))
    
    @staticmethod
    def verify_round(server_seed: str, server_hash: str, crash_multiplier: Decimal) -> bool:
        """
        Verify that a round was fair by checking:
        1. Hash matches the seed
        2. Crash multiplier can be reproduced from seed
        """
        # Verify hash
        computed_hash = RoundsEngine.compute_hash(server_seed)
        if computed_hash != server_hash:
            return False
        
        # Verify crash multiplier
        computed_multiplier = RoundsEngine.compute_crash_multiplier(server_seed)
        if abs(computed_multiplier - crash_multiplier) > Decimal('0.01'):
            return False
        
        return True
    
    @staticmethod
    def create_round() -> Round:
        """Create a new round with pre-computed hash"""
        server_seed = RoundsEngine.generate_server_seed()
        server_hash = RoundsEngine.compute_hash(server_seed)
        crash_multiplier = RoundsEngine.compute_crash_multiplier(server_seed)
        
        round_obj = Round.objects.create(
            server_seed_hash=server_hash,
            server_seed_revealed=server_seed,  # Store but don't reveal until crash
            crash_multiplier=crash_multiplier,
            state='PRE_ROUND'
        )
        
        return round_obj
    
    @staticmethod
    def start_round(round_obj: Round):
        """Transition round to FLYING state"""
        round_obj.state = 'FLYING'
        round_obj.start_time = timezone.now()
        round_obj.save()
    
    @staticmethod
    def crash_round(round_obj: Round):
        """Transition round to CRASHED state and reveal seed"""
        round_obj.state = 'CRASHED'
        round_obj.save()
        # Seed is already stored, just needs to be sent to clients
    
    @staticmethod
    def get_current_round() -> Round:
        """Get or create the current active round"""
        # Try to get the most recent round
        round_obj = Round.objects.filter(
            state__in=['PRE_ROUND', 'FLYING']
        ).first()
        
        if not round_obj:
            # Create new round if none exists
            round_obj = RoundsEngine.create_round()
        
        return round_obj


class RoundSimulator:
    """
    Simulates round progression for testing and demo mode
    """
    
    @staticmethod
    def calculate_current_multiplier(start_time: datetime, crash_multiplier: Decimal) -> Decimal:
        """
        Calculate current multiplier based on elapsed time
        Uses exponential growth curve
        """
        elapsed = (timezone.now() - start_time).total_seconds()
        
        # Exponential growth: multiplier = 1.0 + (elapsed^1.5) * growth_rate
        growth_rate = 0.1
        current = 1.0 + (elapsed ** 1.5) * growth_rate
        
        # Cap at crash multiplier
        current = min(current, float(crash_multiplier))
        
        return Decimal(str(round(current, 2)))
