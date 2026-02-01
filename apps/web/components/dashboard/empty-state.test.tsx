import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Activity } from 'lucide-react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      render(<EmptyState title="No data available" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(<EmptyState title="No data" description="Start by adding some items" />);
      expect(screen.getByText('Start by adding some items')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const { container } = render(<EmptyState title="No data" />);
      const description = container.querySelector('p.text-muted-foreground');
      expect(description).not.toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(<EmptyState title="No data" icon={<Activity data-testid="activity-icon" />} />);
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      const { container } = render(<EmptyState title="No data" />);
      const iconContainer = container.querySelector('.mb-4.text-muted-foreground');
      expect(iconContainer).not.toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should render action button when action is provided', () => {
      const handleClick = vi.fn();
      render(<EmptyState title="No data" action={{ label: 'Add item', onClick: handleClick }} />);
      expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
    });

    it('should not render action button when action is not provided', () => {
      render(<EmptyState title="No data" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EmptyState title="No data" action={{ label: 'Add item', onClick: handleClick }} />);

      await user.click(screen.getByRole('button', { name: 'Add item' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<EmptyState title="No data" className="custom-class" />);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should have dashed border style', () => {
      const { container } = render(<EmptyState title="No data" />);
      const card = container.firstChild;
      expect(card).toHaveClass('border-dashed');
    });
  });

  describe('Full Example', () => {
    it('should render all elements together', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          icon={<Activity data-testid="icon" />}
          title="No activities found"
          description="Start tracking your workouts to see them here"
          action={{ label: 'Add activity', onClick: handleClick }}
        />,
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('No activities found')).toBeInTheDocument();
      expect(screen.getByText('Start tracking your workouts to see them here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add activity' })).toBeInTheDocument();
    });
  });
});
