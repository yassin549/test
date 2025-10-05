import { useState, useEffect } from 'react';
import { getDemoSimulator, cleanupDemoSimulator } from '@/lib/rounds-simulator';

type GameStatus = 'waiting' | 'flying' | 'crashed';

interface GameState {
  status: GameStatus;
  multiplier: number;
  countdown: number;
  crashPoint: number;
  roundId: number;
  serverHash: string;
  serverSeed: string;
}

export const useGameSimulation = (demoSeed: string) => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    multiplier: 1.0,
    countdown: 5,
    crashPoint: 0,
    roundId: 1,
    serverHash: '',
    serverSeed: '',
  });

  useEffect(() => {
    const simulator = getDemoSimulator(demoSeed);

    // Listen to round events
    const handlePreRound = (event: any) => {
      setGameState((prev) => ({
        ...prev,
        status: 'waiting',
        countdown: event.data.countdown,
        roundId: event.data.round_id,
        serverHash: event.data.server_hash,
        serverSeed: '', // Not revealed yet
      }));
    };

    const handleTick = (event: any) => {
      setGameState((prev) => ({
        ...prev,
        status: 'flying',
        multiplier: event.data.multiplier,
        countdown: 0,
      }));
    };

    const handleCrash = (event: any) => {
      setGameState((prev) => ({
        ...prev,
        status: 'crashed',
        multiplier: event.data.crash_multiplier,
        crashPoint: event.data.crash_multiplier,
        serverSeed: event.data.server_seed,
      }));
    };

    simulator.on('round:pre', handlePreRound);
    simulator.on('round:tick', handleTick);
    simulator.on('round:crash', handleCrash);

    // Start simulator
    simulator.start();

    return () => {
      simulator.off('round:pre', handlePreRound);
      simulator.off('round:tick', handleTick);
      simulator.off('round:crash', handleCrash);
      cleanupDemoSimulator();
    };
  }, [demoSeed]);

  return gameState;
};
