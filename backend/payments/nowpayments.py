import requests
import hmac
import hashlib
from decimal import Decimal
from typing import Dict, Optional
from django.conf import settings


class NowPaymentsClient:
    """
    Client wrapper for NowPayments API
    """
    
    BASE_URL = "https://api.nowpayments.io/v1"
    SANDBOX_URL = "https://api-sandbox.nowpayments.io/v1"
    
    def __init__(self, api_key: str, use_sandbox: bool = False):
        self.api_key = api_key
        self.base_url = self.SANDBOX_URL if use_sandbox else self.BASE_URL
        self.headers = {
            'x-api-key': api_key,
            'Content-Type': 'application/json'
        }
    
    def get_available_currencies(self) -> list:
        """Get list of available cryptocurrencies"""
        try:
            response = requests.get(
                f"{self.base_url}/currencies",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json().get('currencies', [])
        except Exception as e:
            print(f"Error fetching currencies: {e}")
            return ['btc', 'eth', 'usdt']  # Fallback
    
    def get_estimate(self, amount: Decimal, currency_from: str, currency_to: str) -> Dict:
        """
        Get estimated amount for conversion
        amount: Amount in currency_from
        currency_from: Source currency (e.g., 'usd')
        currency_to: Target cryptocurrency (e.g., 'btc')
        """
        try:
            params = {
                'amount': float(amount),
                'currency_from': currency_from.lower(),
                'currency_to': currency_to.lower()
            }
            response = requests.get(
                f"{self.base_url}/estimate",
                params=params,
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting estimate: {e}")
            # Return mock estimate for development
            return {
                'currency_from': currency_from,
                'currency_to': currency_to,
                'estimated_amount': float(amount) / 50000  # Mock rate
            }
    
    def create_invoice(
        self,
        price_amount: Decimal,
        price_currency: str,
        pay_currency: str,
        order_id: str,
        order_description: str = "",
        ipn_callback_url: Optional[str] = None
    ) -> Dict:
        """
        Create a payment invoice
        """
        try:
            payload = {
                'price_amount': float(price_amount),
                'price_currency': price_currency.upper(),
                'pay_currency': pay_currency.lower(),
                'order_id': order_id,
                'order_description': order_description or f"Deposit {price_amount} {price_currency}",
            }
            
            if ipn_callback_url:
                payload['ipn_callback_url'] = ipn_callback_url
            
            response = requests.post(
                f"{self.base_url}/invoice",
                json=payload,
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creating invoice: {e}")
            raise
    
    def get_invoice_status(self, invoice_id: str) -> Dict:
        """Get invoice status"""
        try:
            response = requests.get(
                f"{self.base_url}/invoice/{invoice_id}",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting invoice status: {e}")
            raise
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
        """
        Verify webhook signature from NowPayments
        """
        try:
            computed_signature = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha512
            ).hexdigest()
            return hmac.compare_digest(computed_signature, signature)
        except Exception as e:
            print(f"Error verifying signature: {e}")
            return False


def get_nowpayments_client() -> NowPaymentsClient:
    """Get configured NowPayments client"""
    api_key = getattr(settings, 'NOWPAYMENTS_API_KEY', '')
    use_sandbox = getattr(settings, 'NOWPAYMENTS_SANDBOX', True)
    return NowPaymentsClient(api_key, use_sandbox)
