import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BetCardProps {
  balance: number;
  onPlaceBet: (amount: number, autoCashout?: number) => void;
  onCashOut: () => void;
  gameStatus: 'waiting' | 'flying' | 'crashed';
  hasBet: boolean;
  currentMultiplier?: number;
}

const PRESET_CHIPS = [10, 50, 100, 500];

export const BetCard: React.FC<BetCardProps> = ({
  balance,
  onPlaceBet,
  onCashOut,
  gameStatus,
  hasBet,
  currentMultiplier,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('crypto');

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && gameStatus === 'waiting' && !hasBet) {
        handlePlaceBet();
      } else if (e.key === ' ' && gameStatus === 'flying' && hasBet) {
        e.preventDefault();
        onCashOut();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, hasBet, betAmount, autoCashout]);

  const handlePlaceBet = () => {
    if (betAmount > balance) {
      alert('Insufficient balance');
      return;
    }
    const autoCashoutValue = autoCashout ? parseFloat(autoCashout) : undefined;
    onPlaceBet(betAmount, autoCashoutValue);
  };

  const handleChipClick = (amount: number) => {
    setBetAmount(amount);
  };

  return (
    <Card className="p-4 sm:p-6 sticky bottom-0 sm:relative">
      <div className="space-y-4">
        {/* Bet Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Bet Amount (TND)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min="1"
              max={balance}
              className="flex-1 px-4 py-2 bg-surface border border-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-quick"
              disabled={hasBet || gameStatus === 'flying'}
            />
          </div>
          
          {/* Preset Chips */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {PRESET_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                disabled={hasBet || gameStatus === 'flying'}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  transition-all duration-quick
                  ${betAmount === chip 
                    ? 'bg-primary text-white' 
                    : 'bg-surface hover:bg-surface/80 text-text/80'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('crypto')}
              className={`
                flex-1 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-quick
                ${paymentMethod === 'crypto'
                  ? 'bg-primary text-white'
                  : 'bg-surface hover:bg-surface/80 text-text/80'
                }
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                Crypto
              </span>
            </button>
          </div>
        </div>

        {/* Auto Cashout */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Auto Cashout (optional)
            <span className="text-xs text-text/60 ml-2">e.g., 2.5x</span>
          </label>
          <input
            type="text"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            placeholder="2.00"
            className="w-full px-4 py-2 bg-surface border border-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-quick"
            disabled={hasBet || gameStatus === 'flying'}
          />
        </div>

        {/* Action Button */}
        {!hasBet ? (
          <Button
            variant="primary"
            onClick={handlePlaceBet}
            disabled={gameStatus === 'flying' || betAmount <= 0 || betAmount > balance}
            className="w-full text-lg py-3"
          >
            Place Bet ({betAmount} TND)
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onCashOut}
            disabled={gameStatus !== 'flying'}
            className={`
              w-full text-lg py-3
              ${gameStatus === 'flying' ? 'bg-amber hover:bg-amber/90 animate-pulse motion-reduce:animate-none' : ''}
            `}
          >
            {gameStatus === 'flying' 
              ? `Cash Out (${currentMultiplier?.toFixed(2)}x = ${(betAmount * (currentMultiplier || 1)).toFixed(2)} TND)`
              : 'Waiting for next round...'
            }
          </Button>
        )}

        {/* Helper Text */}
        {!hasBet && (
          <p className="text-xs text-text/60 text-center">
            💡 Place bet → Cash out before the plane crashes to lock multiplier
          </p>
        )}

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-text/40 text-center space-x-4">
          <span>Enter: Place Bet</span>
          <span>Space: Cash Out</span>
        </div>
      </div>
    </Card>
  );
};
