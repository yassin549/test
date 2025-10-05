// Browser-compatible EventEmitter
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }

  removeAllListeners() {
    this.events = {};
  }
}

interface RoundEvent {
  type: 'round:pre' | 'round:tick' | 'round:crash';
  data: {
    round_id: number;
    server_hash?: string;
    countdown?: number;
    multiplier?: number;
    crash_multiplier?: number;
    server_seed?: string;
    timestamp: string;
  };
}

/**
 * Seeded pseudo-random number generator for deterministic simulation
 */
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashCode(seed);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

/**
 * Deterministic rounds simulator for demo mode
 * Mimics server behavior with provably-fair mechanics
 */
export class RoundsSimulator extends EventEmitter {
  private isRunning: boolean = false;
  private currentRoundId: number = 1;
  private serverSeed: string = '';
  private serverHash: string = '';
  private crashMultiplier: number = 1.0;
  private startTime: number = 0;
  private animationFrame: number | null = null;
  private demoSeed: string;

  constructor(demoSeed: string) {
    super();
    this.demoSeed = demoSeed;
  }

  /**
   * Compute SHA-256 hash (simplified for demo)
   */
  private async computeHash(seed: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate server seed from demo seed and round number
   */
  private generateServerSeed(roundId: number): string {
    return `${this.demoSeed}_round_${roundId}_${Date.now()}`;
  }

  /**
   * Compute crash multiplier from server seed (deterministic)
   */
  private computeCrashMultiplier(serverSeed: string): number {
    const rng = new SeededRandom(serverSeed);
    const random = rng.next();

    // Apply house edge and generate crash point
    const houseEdge = 0.03;
    const normalized = Math.max(0.0001, random);
    let crashPoint = (1 - houseEdge) / (1 - normalized);

    // Clamp between 1.00x and 100.00x
    crashPoint = Math.max(1.0, Math.min(100.0, crashPoint));

    return Math.round(crashPoint * 100) / 100;
  }

  /**
   * Calculate current multiplier based on elapsed time
   */
  private calculateCurrentMultiplier(): number {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const growthRate = 0.1;
    const current = 1.0 + Math.pow(elapsed, 1.5) * growthRate;
    return Math.min(current, this.crashMultiplier);
  }

  /**
   * Start a new round
   */
  async startRound() {
    // Generate server seed and hash
    this.serverSeed = this.generateServerSeed(this.currentRoundId);
    this.serverHash = await this.computeHash(this.serverSeed);
    this.crashMultiplier = this.computeCrashMultiplier(this.serverSeed);

    // Emit pre-round event
    this.emit('round:pre', {
      type: 'round:pre',
      data: {
        round_id: this.currentRoundId,
        server_hash: this.serverHash,
        countdown: 5,
        timestamp: new Date().toISOString(),
      },
    } as RoundEvent);

    // Countdown
    await this.countdown(5);

    // Start flying
    this.startTime = Date.now();
    this.flyingPhase();
  }

  /**
   * Countdown phase
   */
  private async countdown(seconds: number) {
    for (let i = seconds; i > 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.emit('round:pre', {
        type: 'round:pre',
        data: {
          round_id: this.currentRoundId,
          server_hash: this.serverHash,
          countdown: i - 1,
          timestamp: new Date().toISOString(),
        },
      } as RoundEvent);
    }
  }

  /**
   * Flying phase with multiplier updates
   */
  private flyingPhase() {
    const tick = () => {
      if (!this.isRunning) return;

      const currentMultiplier = this.calculateCurrentMultiplier();

      // Emit tick event
      this.emit('round:tick', {
        type: 'round:tick',
        data: {
          round_id: this.currentRoundId,
          multiplier: Math.round(currentMultiplier * 100) / 100,
          timestamp: new Date().toISOString(),
        },
      } as RoundEvent);

      // Check if crashed
      if (currentMultiplier >= this.crashMultiplier) {
        this.crashPhase();
      } else {
        this.animationFrame = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  /**
   * Crash phase - reveal seed
   */
  private crashPhase() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Emit crash event with seed reveal
    this.emit('round:crash', {
      type: 'round:crash',
      data: {
        round_id: this.currentRoundId,
        crash_multiplier: this.crashMultiplier,
        server_seed: this.serverSeed,
        timestamp: new Date().toISOString(),
      },
    } as RoundEvent);

    // Wait 3 seconds then start next round
    setTimeout(() => {
      if (this.isRunning) {
        this.currentRoundId++;
        this.startRound();
      }
    }, 3000);
  }

  /**
   * Start the simulator
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startRound();
  }

  /**
   * Stop the simulator
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Verify a round was fair
   */
  async verifyRound(serverSeed: string, serverHash: string, crashMultiplier: number): Promise<boolean> {
    // Verify hash
    const computedHash = await this.computeHash(serverSeed);
    if (computedHash !== serverHash) {
      return false;
    }

    // Verify crash multiplier
    const computedMultiplier = this.computeCrashMultiplier(serverSeed);
    if (Math.abs(computedMultiplier - crashMultiplier) > 0.01) {
      return false;
    }

    return true;
  }
}

/**
 * Create a singleton instance for demo mode
 */
let simulatorInstance: RoundsSimulator | null = null;

export function getDemoSimulator(demoSeed: string): RoundsSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new RoundsSimulator(demoSeed);
  }
  return simulatorInstance;
}

export function cleanupDemoSimulator() {
  if (simulatorInstance) {
    simulatorInstance.stop();
    simulatorInstance.removeAllListeners();
    simulatorInstance = null;
  }
}
