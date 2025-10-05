import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getDemoSession, clearDemoSession, updateDemoBalance } from '@/lib/demo-session';
import { GameCanvas } from '@/components/game/GameCanvas';
import { BetCard } from '@/components/game/BetCard';
import { SocialPanel } from '@/components/game/SocialPanel';
import { RoundProof } from '@/components/game/RoundProof';
import { useGameSimulation } from '@/hooks/useGameSimulation';
import { getDemoSimulator } from '@/lib/rounds-simulator';

interface DemoUser {
  id: string;
  displayName: string;
  balance_tnd: number;
  created_at: string;
  isDemo: true;
}

interface Winner {
  id: string;
  username: string;
  multiplier: number;
  amount: number;
  timestamp: Date;
}

export default function Game() {
  const router = useRouter();
  const { mode } = router.query;
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [currentBet, setCurrentBet] = useState<number | null>(null);
  const [autoCashout, setAutoCashout] = useState<number | undefined>();
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [demoSeed, setDemoSeed] = useState('demo_seed_default');

  const gameState = useGameSimulation(demoSeed);

  useEffect(() => {
    if (mode === 'demo') {
      const session = getDemoSession();
      if (session) {
        setDemoUser(session);
        setBalance(session.balance_tnd);
      } else {
        router.push('/');
      }
    }
  }, [mode, router]);

  // Auto cashout logic
  useEffect(() => {
    if (
      gameState.status === 'flying' &&
      currentBet !== null &&
      autoCashout &&
      gameState.multiplier >= autoCashout
    ) {
      handleCashOut();
    }
  }, [gameState.multiplier, gameState.status, currentBet, autoCashout]);

  // Reset bet when round crashes
  useEffect(() => {
    if (gameState.status === 'crashed' && currentBet !== null) {
      // Player lost the bet
      setCurrentBet(null);
      setAutoCashout(undefined);
    }
  }, [gameState.status]);

  const handlePlaceBet = (amount: number, autoCashoutValue?: number) => {
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    // Deduct bet from balance
    const newBalance = balance - amount;
    setBalance(newBalance);
    setCurrentBet(amount);
    setAutoCashout(autoCashoutValue);

    // Update demo session
    if (demoUser) {
      updateDemoBalance(newBalance);
      setDemoUser({ ...demoUser, balance_tnd: newBalance });
    }

    // Animate balance deduction
    animateBalanceChange(-amount);
  };

  const handleCashOut = () => {
    if (currentBet === null || gameState.status !== 'flying') return;

    const winAmount = currentBet * gameState.multiplier;
    const profit = winAmount - currentBet;
    const newBalance = balance + winAmount;

    setBalance(newBalance);

    // Update demo session
    if (demoUser) {
      updateDemoBalance(newBalance);
      setDemoUser({ ...demoUser, balance_tnd: newBalance });
    }

    // Add to winners reel
    const winner: Winner = {
      id: Date.now().toString(),
      username: demoUser?.displayName || 'Player',
      multiplier: gameState.multiplier,
      amount: profit,
      timestamp: new Date(),
    };
    setRecentWinners((prev) => [winner, ...prev].slice(0, 10));

    // Show confetti for big wins
    if (gameState.multiplier >= 5.0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Animate balance increase
    animateBalanceChange(winAmount);

    // Reset bet
    setCurrentBet(null);
    setAutoCashout(undefined);
  };

  const animateBalanceChange = (amount: number) => {
    // Simple animation placeholder - could be enhanced with a library
    console.log(`Balance changed by ${amount.toFixed(2)} TND`);
  };

  const handleExitDemo = () => {
    clearDemoSession();
    router.push('/');
  };

  const handleDeposit = () => {
    alert('Deposit functionality coming soon!');
  };

  const isDemo = mode === 'demo';

  return (
    <>
      <Head>
        <title>{isDemo ? 'Demo Mode' : 'Play'} — Aviator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-bg text-text">
        {/* Top Bar - Fixed */}
        <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">Aviator</h1>
                {isDemo && (
                  <span className="px-2 py-1 bg-amber/20 text-amber text-xs rounded-full">
                    Demo
                  </span>
                )}
              </div>

              {/* Balance */}
              <div className="flex items-center gap-2">
                <Card className="px-4 py-2">
                  <div className="text-center">
                    <p className="text-xs text-text/60">Balance</p>
                    <p className="font-bold text-lg text-amber">
                      {balance.toFixed(2)} TND
                    </p>
                  </div>
                </Card>

                {/* Deposit CTA */}
                <Button
                  variant="primary"
                  onClick={handleDeposit}
                  className="hidden sm:block"
                >
                  Deposit
                </Button>

                {/* Avatar Menu */}
                <button
                  onClick={handleExitDemo}
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors duration-quick"
                >
                  <span className="font-bold text-sm">
                    {demoUser?.displayName?.charAt(0) || 'P'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Center: Game Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Game Canvas */}
              <Card className="p-4">
                <GameCanvas
                  status={gameState.status}
                  multiplier={gameState.multiplier}
                  countdown={gameState.countdown}
                />
              </Card>

              {/* Round Proof */}
              <RoundProof
                roundId={gameState.roundId}
                serverHash={gameState.serverHash}
                serverSeed={gameState.serverSeed}
                crashMultiplier={gameState.crashPoint}
                onVerify={async (seed, hash, multiplier) => {
                  const simulator = getDemoSimulator(demoSeed);
                  return await simulator.verifyRound(seed, hash, multiplier);
                }}
              />

              {/* Bet Card */}
              <BetCard
                balance={balance}
                onPlaceBet={handlePlaceBet}
                onCashOut={handleCashOut}
                gameStatus={gameState.status}
                hasBet={currentBet !== null}
                currentMultiplier={gameState.multiplier}
              />
            </div>

            {/* Right: Social Panel */}
            <div className="hidden lg:block">
              <SocialPanel recentWinners={recentWinners} />
            </div>
          </div>

          {/* Mobile Social Panel - Slide up */}
          <div className="lg:hidden mt-6">
            <SocialPanel recentWinners={recentWinners} />
          </div>
        </main>

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-6xl animate-bounce motion-reduce:animate-none">
              🎉
            </div>
          </div>
        )}
      </div>
    </>
  );
}
