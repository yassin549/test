import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement actual magic link/passwordless flow
    // For now, simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Show tooltip
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);

    // Redirect to game
    setTimeout(() => {
      router.push('/game?mode=real');
    }, 1500);
  };

  const handleWalletConnect = () => {
    // TODO: Implement wallet connect integration
    alert('Wallet Connect integration coming soon!');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Sign Up — Aviator</title>
        <meta name="description" content="Create your account to play Aviator for real" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <button
                onClick={handleBackToHome}
                className="text-text/60 hover:text-text transition-colors duration-quick flex items-center gap-2 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="font-display text-3xl font-bold">Create Account</h1>
              <p className="text-text/70">Start playing for real in seconds</p>
            </div>

            {/* Email signup form */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-surface border border-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-quick"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="w-full text-lg py-3"
              >
                {isLoading ? 'Creating Account...' : 'Continue with Email'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface/50 text-text/60">or</span>
              </div>
            </div>

            {/* Wallet Connect */}
            <Button
              variant="ghost"
              onClick={handleWalletConnect}
              className="w-full text-lg py-3 border-2 border-accent/50"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.913 7.519c3.915-3.831 10.26-3.831 14.174 0l.471.461a.483.483 0 010 .694l-1.611 1.577a.252.252 0 01-.354 0l-.649-.634c-2.73-2.673-7.157-2.673-9.887 0l-.694.68a.252.252 0 01-.354 0L4.398 8.72a.483.483 0 010-.694l.515-.507zm17.506 3.263l1.434 1.404a.483.483 0 010 .694l-6.466 6.331a.505.505 0 01-.708 0l-4.588-4.493a.126.126 0 00-.177 0l-4.589 4.493a.505.505 0 01-.708 0l-6.466-6.331a.483.483 0 010-.694l1.434-1.404a.505.505 0 01.708 0l4.589 4.493c.049.048.128.048.177 0l4.588-4.493a.505.505 0 01.708 0l4.589 4.493c.049.048.128.048.177 0l4.588-4.493a.505.505 0 01.708 0z" />
              </svg>
              Connect Wallet
            </Button>

            {/* Info tooltip */}
            {showTooltip && (
              <div className="bg-primary/20 border border-primary/50 rounded-md p-3 text-sm animate-fade-in">
                <p className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>No KYC at signup — add verification later for higher limits</span>
                </p>
              </div>
            )}

            {/* Trust note */}
            <div className="pt-4 border-t border-surface">
              <p className="text-xs text-text/60 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy.
                No KYC required to start playing.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
