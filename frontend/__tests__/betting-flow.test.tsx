import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BetCard } from '@/components/game/BetCard';

describe('Betting Flow', () => {
  const mockOnPlaceBet = jest.fn();
  const mockOnCashOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows placing a bet during waiting phase', () => {
    render(
      <BetCard
        balance={1000}
        onPlaceBet={mockOnPlaceBet}
        onCashOut={mockOnCashOut}
        gameStatus="waiting"
        hasBet={false}
      />
    );

    const betInput = screen.getByRole('spinbutton');
    fireEvent.change(betInput, { target: { value: '100' } });

    const placeBetButton = screen.getByRole('button', { name: /Place Bet \(100 TND\)/i });
    fireEvent.click(placeBetButton);

    expect(mockOnPlaceBet).toHaveBeenCalledWith(100, undefined);
  });

  it('shows cash out button during flying phase with active bet', () => {
    render(
      <BetCard
        balance={900}
        onPlaceBet={mockOnPlaceBet}
        onCashOut={mockOnCashOut}
        gameStatus="flying"
        hasBet={true}
        currentMultiplier={2.5}
      />
    );

    const cashOutButton = screen.getByRole('button', { name: /Cash Out \(2\.50x/i });
    expect(cashOutButton).toBeInTheDocument();
    expect(cashOutButton).toHaveTextContent('2.50x');
  });

  it('triggers cashout when space key is pressed', () => {
    render(
      <BetCard
        balance={900}
        onPlaceBet={mockOnPlaceBet}
        onCashOut={mockOnCashOut}
        gameStatus="flying"
        hasBet={true}
        currentMultiplier={2.5}
      />
    );

    fireEvent.keyDown(window, { key: ' ' });

    expect(mockOnCashOut).toHaveBeenCalled();
  });

  it('prevents betting more than available balance', () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    render(
      <BetCard
        balance={50}
        onPlaceBet={mockOnPlaceBet}
        onCashOut={mockOnCashOut}
        gameStatus="waiting"
        hasBet={false}
      />
    );

    const betInput = screen.getByRole('spinbutton');
    fireEvent.change(betInput, { target: { value: '100' } });

    const placeBetButton = screen.getByRole('button', { name: /Place Bet \(100 TND\)/i });
    fireEvent.click(placeBetButton);

    expect(mockOnPlaceBet).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('allows setting auto-cashout multiplier', () => {
    render(
      <BetCard
        balance={1000}
        onPlaceBet={mockOnPlaceBet}
        onCashOut={mockOnCashOut}
        gameStatus="waiting"
        hasBet={false}
      />
    );

    const autoCashoutInput = screen.getByPlaceholderText('2.00');
    fireEvent.change(autoCashoutInput, { target: { value: '3.5' } });

    const placeBetButton = screen.getByRole('button', { name: /Place Bet/i });
    fireEvent.click(placeBetButton);

    expect(mockOnPlaceBet).toHaveBeenCalledWith(50, 3.5);
  });

  it('displays preset chip buttons', () => {
    render(
      <BetCard
        balance={1000}
        onPlaceBet={mockOnPlaceBet}
        onCashOut={mockOnCashOut}
        gameStatus="waiting"
        hasBet={false}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
