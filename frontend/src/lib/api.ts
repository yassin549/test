/**
 * API service for interacting with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface PlaceBetRequest {
  amount_tnd: number;
  auto_cashout_multiplier?: number;
  idempotency_key?: string;
}

interface CashoutRequest {
  current_multiplier: number;
}

interface Bet {
  id: number;
  amount_tnd: number;
  auto_cashout_multiplier?: number;
  cashed_out_at?: string;
  cashed_out_multiplier?: number;
  win_amount_tnd?: number;
  status: string;
  placed_at: string;
}

interface Balance {
  balance_tnd: number;
  balance_minor_units: number;
  crypto_equivalents: Array<{
    coin: string;
    amount: number;
    rate_timestamp: string;
  }>;
}

interface LedgerEntry {
  id: number;
  type: string;
  amount_tnd: number;
  balance_before: number;
  balance_after: number;
  meta: Record<string, any>;
  timestamp: string;
}

class ApiService {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getAuthToken(): string | null {
    if (!this.authToken && typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token');
    }
    return this.authToken;
  }

  clearAuthToken() {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Betting endpoints
  async placeBet(data: PlaceBetRequest): Promise<Bet> {
    return this.request<Bet>('/games/bets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cashoutBet(betId: number, data: CashoutRequest): Promise<Bet> {
    return this.request<Bet>(`/games/bets/${betId}/cashout/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBets(): Promise<Bet[]> {
    return this.request<Bet[]>('/games/bets/');
  }

  // Balance endpoints
  async getBalance(): Promise<Balance> {
    return this.request<Balance>('/games/balance/');
  }

  async getLedger(): Promise<LedgerEntry[]> {
    return this.request<LedgerEntry[]>('/games/ledger/');
  }
}

export const apiService = new ApiService();
export type { Bet, Balance, LedgerEntry, PlaceBetRequest, CashoutRequest };
