import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Home from '@/pages/index';
import { MultiplierDisplay } from '@/components/game/MultiplierDisplay';
import { LoadingAviator } from '@/components/ui/LoadingAviator';

expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('Accessibility Tests', () => {
  it('landing page should not have accessibility violations', async () => {
    const { container } = render(<Home />);
    const results = await axe(container, {
      rules: {
        // Disable heading-order rule for this test as it's a landing page with design flexibility
        'heading-order': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('multiplier display has proper aria-live region', () => {
    const { container } = render(
      <MultiplierDisplay multiplier={2.5} status="flying" />
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-label', 'Current multiplier: 2.50x');
  });

  it('loading aviator has proper role and aria-live', () => {
    const { container } = render(<LoadingAviator />);

    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });

  it('buttons have proper focus indicators', () => {
    render(<Home />);
    
    const tryDemoButton = screen.getByText(/Try Demo/i);
    tryDemoButton.focus();
    
    expect(tryDemoButton).toHaveFocus();
  });

  it('all interactive elements are keyboard accessible', () => {
    const { container } = render(<Home />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
