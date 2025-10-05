import React, { useEffect, useState } from 'react';

interface MultiplierDisplayProps {
  multiplier: number;
  status: 'waiting' | 'flying' | 'crashed';
}

export const MultiplierDisplay: React.FC<MultiplierDisplayProps> = ({ multiplier, status }) => {
  const [displayMultiplier, setDisplayMultiplier] = useState(multiplier);

  useEffect(() => {
    setDisplayMultiplier(multiplier);
  }, [multiplier]);

  const getStatusColor = () => {
    switch (status) {
      case 'waiting':
        return 'text-text/60';
      case 'flying':
        return 'text-amber';
      case 'crashed':
        return 'text-red-500';
      default:
        return 'text-text';
    }
  };

  const getGlowEffect = () => {
    if (status === 'flying') {
      return 'drop-shadow-[0_0_20px_rgba(255,176,46,0.6)]';
    }
    if (status === 'crashed') {
      return 'drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]';
    }
    return '';
  };

  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={`Current multiplier: ${displayMultiplier.toFixed(2)}x`}
    >
      <div
        className={`
          font-display font-bold
          text-4xl sm:text-6xl md:text-7xl lg:text-8xl
          ${getStatusColor()}
          ${getGlowEffect()}
          transition-all duration-medium
          ${status === 'crashed' ? 'animate-pulse' : ''}
          motion-reduce:animate-none
        `}
        style={{
          background: status === 'flying' 
            ? 'linear-gradient(135deg, var(--amber) 0%, var(--primary) 100%)'
            : undefined,
          WebkitBackgroundClip: status === 'flying' ? 'text' : undefined,
          WebkitTextFillColor: status === 'flying' ? 'transparent' : undefined,
          backgroundClip: status === 'flying' ? 'text' : undefined,
        }}
      >
        {displayMultiplier.toFixed(2)}x
      </div>
      {status === 'crashed' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-500 text-2xl font-bold animate-fade-in">
            CRASHED!
          </span>
        </div>
      )}
    </div>
  );
};
