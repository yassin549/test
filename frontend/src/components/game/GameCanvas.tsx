import React, { useEffect, useRef, useState } from 'react';
import { MultiplierDisplay } from './MultiplierDisplay';

interface GameCanvasProps {
  status: 'waiting' | 'flying' | 'crashed';
  multiplier: number;
  countdown?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ status, multiplier, countdown }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [planePosition, setPlanePosition] = useState({ x: 10, y: 50 });

  useEffect(() => {
    if (status === 'flying') {
      // Animate plane moving up and to the right
      const interval = setInterval(() => {
        setPlanePosition((prev) => ({
          x: Math.min(prev.x + 0.5, 90),
          y: Math.max(prev.y - 0.3, 10),
        }));
      }, 50);
      return () => clearInterval(interval);
    } else if (status === 'crashed') {
      // Plane falls down
      const interval = setInterval(() => {
        setPlanePosition((prev) => ({
          x: prev.x,
          y: Math.min(prev.y + 2, 100),
        }));
      }, 30);
      setTimeout(() => clearInterval(interval), 240);
      return () => clearInterval(interval);
    } else {
      // Reset position for next round
      setPlanePosition({ x: 10, y: 50 });
    }
  }, [status]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-surface/80 to-bg rounded-md overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border border-primary/20" />
          ))}
        </div>
      </div>

      {/* Flight path trail */}
      {status === 'flying' && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ filter: 'blur(1px)' }}
        >
          <path
            d={`M ${planePosition.x - 20}% ${planePosition.y + 10}% Q ${planePosition.x - 10}% ${planePosition.y + 5}%, ${planePosition.x}% ${planePosition.y}%`}
            stroke="rgba(43, 111, 255, 0.3)"
            strokeWidth="3"
            fill="none"
            className="motion-reduce:hidden"
          />
        </svg>
      )}

      {/* Plane */}
      <div
        className={`absolute transition-all ${status === 'crashed' ? 'duration-[240ms]' : 'duration-medium'} motion-reduce:transition-none`}
        style={{
          left: `${planePosition.x}%`,
          top: `${planePosition.y}%`,
          transform: status === 'crashed' ? 'rotate(90deg)' : 'rotate(-15deg)',
        }}
      >
        <svg
          className={`w-16 h-16 ${status === 'crashed' ? 'text-red-500' : 'text-primary'} transition-colors duration-quick`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      </div>

      {/* Countdown or Multiplier Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        {status === 'waiting' && countdown !== undefined ? (
          <div className="text-center">
            <div className="text-8xl font-display font-bold text-primary animate-pulse motion-reduce:animate-none">
              {countdown}
            </div>
            <p className="text-text/60 mt-4">Starting soon...</p>
          </div>
        ) : (
          <MultiplierDisplay multiplier={multiplier} status={status} />
        )}
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === 'waiting' ? 'bg-text/10 text-text/60' :
          status === 'flying' ? 'bg-amber/20 text-amber' :
          'bg-red-500/20 text-red-500'
        }`}>
          {status === 'waiting' ? 'Waiting' : status === 'flying' ? 'In Flight' : 'Crashed'}
        </div>
      </div>
    </div>
  );
};
