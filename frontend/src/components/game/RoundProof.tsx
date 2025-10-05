import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RoundProofProps {
  roundId: number;
  serverHash?: string;
  serverSeed?: string;
  crashMultiplier?: number;
  onVerify?: (seed: string, hash: string, multiplier: number) => Promise<boolean>;
}

export const RoundProof: React.FC<RoundProofProps> = ({
  roundId,
  serverHash,
  serverSeed,
  crashMultiplier,
  onVerify,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleVerify = async () => {
    if (!serverSeed || !serverHash || !crashMultiplier || !onVerify) return;

    setIsVerifying(true);
    try {
      const result = await onVerify(serverSeed, serverHash, crashMultiplier);
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const truncateHash = (hash: string, length: number = 8) => {
    if (!hash) return '';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="p-3 text-xs">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-text/80">
            🔒 Provably Fair - Round #{roundId}
          </h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-primary hover:text-primary/80 transition-colors duration-quick"
          >
            {showDetails ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDetails && (
          <>
            {/* Pre-round Hash */}
            {serverHash && (
              <div className="space-y-1">
                <p className="text-text/60">Server Hash (Pre-round):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface px-2 py-1 rounded text-[10px] font-mono text-amber">
                    {truncateHash(serverHash, 12)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(serverHash)}
                    className="text-text/60 hover:text-text transition-colors duration-quick"
                    title="Copy full hash"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Revealed Seed */}
            {serverSeed && (
              <div className="space-y-1">
                <p className="text-text/60">Server Seed (Revealed):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface px-2 py-1 rounded text-[10px] font-mono text-success">
                    {truncateHash(serverSeed, 12)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(serverSeed)}
                    className="text-text/60 hover:text-text transition-colors duration-quick"
                    title="Copy full seed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Crash Multiplier */}
            {crashMultiplier && (
              <div className="space-y-1">
                <p className="text-text/60">Crash Multiplier:</p>
                <code className="block bg-surface px-2 py-1 rounded text-[10px] font-mono text-amber">
                  {crashMultiplier.toFixed(2)}x
                </code>
              </div>
            )}

            {/* Verify Button */}
            {serverSeed && serverHash && crashMultiplier && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full text-xs py-1"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Round'}
                </Button>

                {verificationResult !== null && (
                  <div
                    className={`mt-2 px-2 py-1 rounded text-center ${
                      verificationResult
                        ? 'bg-success/20 text-success'
                        : 'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {verificationResult ? '✓ Verified Fair' : '✗ Verification Failed'}
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            <p className="text-text/40 text-[10px] pt-2 border-t border-surface">
              💡 Click verify to confirm the round was fair. The hash is published before the round starts, and the seed is revealed after the crash.
            </p>
          </>
        )}
      </div>
    </Card>
  );
};
