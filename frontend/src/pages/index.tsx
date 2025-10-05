import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createDemoSession } from '@/lib/demo-session';

export default function Home() {
  const router = useRouter();

  const handleTryDemo = () => {
    createDemoSession();
    router.push('/game?mode=demo');
  };

  const handlePlayReal = () => {
    router.push('/auth/signup');
  };

  return (
    <>
      <Head>
        <title>Aviator — Fast, Social, Trust-First</title>
        <meta name="description" content="Try the demo instantly or play for real with crypto deposits. No KYC required to play." />
        <meta property="og:title" content="Aviator — Fast, Social, Trust-First" />
        <meta property="og:description" content="Try the demo instantly or play for real with crypto deposits" />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4 sm:p-8">
        <main className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side: Hero content */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Aviator — Fast, Social, Trust-First
                </h1>
                <p className="text-lg sm:text-xl text-text/80">
                  Try the demo instantly or play for real with crypto deposits (NowPayments).
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="primary"
                  onClick={handleTryDemo}
                  className="text-lg px-8 py-3 hover:-translate-y-0.5 transition-transform duration-short motion-reduce:hover:translate-y-0"
                >
                  Try Demo
                </Button>
                <Button
                  variant="ghost"
                  onClick={handlePlayReal}
                  className="text-lg px-8 py-3 border-2 border-accent bg-gradient-to-r from-accent/10 to-primary/10 hover:-translate-y-0.5 transition-transform duration-short motion-reduce:hover:translate-y-0"
                >
                  Play Real
                </Button>
              </div>

              {/* Payment hint */}
              <p className="text-sm text-text/60">
                Crypto deposits via NowPayments. Card & local rails coming soon.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-text/70">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No KYC required to play
                </span>
                <span className="text-text/40">·</span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Min payout 50 TND
                </span>
                <span className="text-text/40">·</span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Provably-fair
                </span>
              </div>
            </div>

            {/* Right side: Live demo tile */}
            <div className="flex justify-center lg:justify-end">
              <Card
                elevate
                onClick={handleTryDemo}
                className="p-8 cursor-pointer max-w-sm w-full hover:shadow-xl transition-shadow duration-medium"
              >
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold">Live Demo</h3>
                  <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 rounded-md overflow-hidden">
                    {/* Animated plane SVG */}
                    <svg
                      className="w-24 h-24 text-primary animate-bounce motion-reduce:animate-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/50 to-transparent" />
                  </div>
                  <p className="text-sm text-text/70 text-center">
                    Click to start playing with demo credits
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
