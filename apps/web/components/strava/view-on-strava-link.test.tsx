import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ViewOnStravaLink } from './view-on-strava-link';

const messages = {
  strava: {
    viewOnStrava: {
      label: 'View on Strava',
      ariaLabel: 'View this activity on Strava',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('ViewOnStravaLink', () => {
  describe('URL Construction', () => {
    it('should construct correct URL from string stravaId', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123456789" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://www.strava.com/activities/123456789');
    });

    it('should construct correct URL from bigint stravaId', () => {
      renderWithIntl(<ViewOnStravaLink stravaId={BigInt(987654321)} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://www.strava.com/activities/987654321');
    });
  });

  describe('Inline Variant', () => {
    it('should render inline variant by default', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('underline');
    });

    it('should render label text', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" />);

      expect(screen.getByText('View on Strava')).toBeInTheDocument();
    });

    it('should render external link icon', () => {
      const { container } = renderWithIntl(<ViewOnStravaLink stravaId="123" />);

      const icon = container.querySelector('svg.lucide-external-link');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should stop click propagation', async () => {
      const parentClickHandler = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <div onClick={parentClickHandler}>
            <ViewOnStravaLink stravaId="123" variant="inline" />
          </div>
        </NextIntlClientProvider>,
      );

      const link = container.querySelector('a')!;
      await user.click(link);

      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('should stop keyboard event propagation', async () => {
      const parentKeyDownHandler = vi.fn();
      const user = userEvent.setup();

      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <div onKeyDown={parentKeyDownHandler}>
            <ViewOnStravaLink stravaId="123" variant="inline" />
          </div>
        </NextIntlClientProvider>,
      );

      const link = screen.getByRole('link');
      link.focus();
      await user.keyboard('{Enter}');

      expect(parentKeyDownHandler).not.toHaveBeenCalled();
    });
  });

  describe('Button Variant', () => {
    it('should render button variant with rounded-md', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" variant="button" />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('rounded-md');
      expect(link).not.toHaveClass('underline');
    });

    it('should use Strava orange color', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" variant="button" />);

      const link = screen.getByRole('link');
      expect(link.className).toContain('text-strava-brand');
    });

    it('should not stop click propagation', async () => {
      const parentClickHandler = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <div onClick={parentClickHandler}>
            <ViewOnStravaLink stravaId="123" variant="button" />
          </div>
        </NextIntlClientProvider>,
      );

      const link = container.querySelector('a')!;
      await user.click(link);

      expect(parentClickHandler).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on inline variant', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'View this activity on Strava');
    });

    it('should have aria-label on button variant', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" variant="button" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'View this activity on Strava');
    });

    it('should open in new tab', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to inline variant', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" className="mt-4" />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('mt-4');
    });

    it('should apply custom className to button variant', () => {
      renderWithIntl(<ViewOnStravaLink stravaId="123" variant="button" className="ml-2" />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('ml-2');
    });
  });
});
