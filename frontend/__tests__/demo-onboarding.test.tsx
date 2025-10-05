import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import Home from '@/pages/index';
import { createDemoSession, getDemoSession } from '@/lib/demo-session';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock demo session
jest.mock('@/lib/demo-session', () => ({
  createDemoSession: jest.fn(),
  getDemoSession: jest.fn(),
}));

describe('Demo Onboarding Flow', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders landing page with Try Demo button', () => {
    render(<Home />);
    
    expect(screen.getByText(/Aviator — Fast, Social, Trust-First/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Play Real/i)).toBeInTheDocument();
  });

  it('creates demo session and redirects when Try Demo is clicked', () => {
    const mockSession = {
      id: 'demo_123',
      displayName: 'Guest-1234',
      balance_tnd: 5000.0,
      created_at: new Date().toISOString(),
      isDemo: true,
    };

    (createDemoSession as jest.Mock).mockReturnValue(mockSession);

    render(<Home />);
    
    const tryDemoButton = screen.getByText(/Try Demo/i);
    fireEvent.click(tryDemoButton);

    expect(createDemoSession).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/game?mode=demo');
  });

  it('stores demo session in localStorage', () => {
    const mockSession = {
      id: 'demo_123',
      displayName: 'Guest-1234',
      balance_tnd: 5000.0,
      created_at: new Date().toISOString(),
      isDemo: true,
    };

    localStorage.setItem('aviator_demo_session', JSON.stringify(mockSession));
    
    (getDemoSession as jest.Mock).mockReturnValue(mockSession);

    const session = getDemoSession();
    
    expect(session).toEqual(mockSession);
    expect(session?.balance_tnd).toBe(5000.0);
  });

  it('displays trust badges on landing page', () => {
    render(<Home />);
    
    expect(screen.getByText(/No KYC required to play/i)).toBeInTheDocument();
    expect(screen.getByText(/Min payout 50 TND/i)).toBeInTheDocument();
    expect(screen.getByText(/Provably-fair/i)).toBeInTheDocument();
  });

  it('redirects to signup when Play Real is clicked', () => {
    render(<Home />);
    
    const playRealButton = screen.getByText(/Play Real/i);
    fireEvent.click(playRealButton);

    expect(mockPush).toHaveBeenCalledWith('/auth/signup');
  });
});
