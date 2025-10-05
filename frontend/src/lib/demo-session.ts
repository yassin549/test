interface DemoUser {
  id: string;
  displayName: string;
  balance_tnd: number;
  created_at: string;
  isDemo: true;
}

const DEMO_SESSION_KEY = 'aviator_demo_session';
const DEFAULT_DEMO_BALANCE = 5000.0;

/**
 * Generate a random demo user ID
 */
function generateDemoUserId(): string {
  const randomNum = Math.floor(Math.random() * 9999);
  return `demo_${Date.now()}_${randomNum}`;
}

/**
 * Generate a display name for the demo user
 */
function generateDisplayName(): string {
  const randomNum = Math.floor(Math.random() * 9999);
  return `Guest-${randomNum.toString().padStart(4, '0')}`;
}

/**
 * Create a new demo session
 */
export function createDemoSession(balance: number = DEFAULT_DEMO_BALANCE): DemoUser {
  const demoUser: DemoUser = {
    id: generateDemoUserId(),
    displayName: generateDisplayName(),
    balance_tnd: balance,
    created_at: new Date().toISOString(),
    isDemo: true,
  };

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
  }

  return demoUser;
}

/**
 * Get existing demo session from localStorage
 */
export function getDemoSession(): DemoUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(DEMO_SESSION_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    // Validate the structure
    if (parsed.id && parsed.displayName && typeof parsed.balance_tnd === 'number' && parsed.isDemo) {
      return parsed as DemoUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear demo session
 */
export function clearDemoSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

/**
 * Update demo user balance
 */
export function updateDemoBalance(newBalance: number): void {
  const session = getDemoSession();
  if (session) {
    session.balance_tnd = newBalance;
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    }
  }
}

/**
 * Get or create demo session
 */
export function getOrCreateDemoSession(): DemoUser {
  const existing = getDemoSession();
  return existing || createDemoSession();
}
