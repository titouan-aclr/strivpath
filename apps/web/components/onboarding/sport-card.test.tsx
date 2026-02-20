import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bike } from 'lucide-react';
import { SportCard } from './sport-card';
import { SportType } from '@/gql/graphql';

describe('SportCard', () => {
  const defaultProps = {
    sport: SportType.Ride,
    title: 'Cycling',
    description: 'Track your cycling activities',
    icon: Bike,
    selected: false,
    disabled: false,
    maxReached: false,
    onToggle: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render with all props', () => {
      render(<SportCard {...defaultProps} />);

      expect(screen.getByText('Cycling')).toBeInTheDocument();
      expect(screen.getByText('Track your cycling activities')).toBeInTheDocument();
    });

    it('should render the icon', () => {
      render(<SportCard {...defaultProps} />);

      const icon = document.querySelector('.lucide-bike');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
      render(<SportCard {...defaultProps} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Cycling: Track your cycling activities');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).toHaveAttribute('aria-disabled', 'false');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Selection State', () => {
    it('should show selected state when selected', () => {
      render(<SportCard {...defaultProps} selected={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Selected')).toBeInTheDocument();
    });

    it('should not show check icon when not selected', () => {
      render(<SportCard {...defaultProps} selected={false} />);

      expect(screen.queryByLabelText('Selected')).not.toBeInTheDocument();
    });

    it('should apply selected styling', () => {
      render(<SportCard {...defaultProps} selected={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveClass('selected-ring');
    });
  });

  describe('Click Interaction', () => {
    it('should call onToggle when clicked', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<SportCard {...defaultProps} onToggle={onToggle} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('should not call onToggle when disabled', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<SportCard {...defaultProps} disabled={true} onToggle={onToggle} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should not call onToggle when maxReached and not selected', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<SportCard {...defaultProps} maxReached={true} selected={false} onToggle={onToggle} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onToggle when Enter key is pressed', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<SportCard {...defaultProps} onToggle={onToggle} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('should call onToggle when Space key is pressed', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<SportCard {...defaultProps} onToggle={onToggle} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('should not call onToggle on other keys', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<SportCard {...defaultProps} onToggle={onToggle} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('a');

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should have disabled styling when disabled', () => {
      render(<SportCard {...defaultProps} disabled={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveAttribute('tabIndex', '-1');
      expect(card).toHaveClass('opacity-60', 'pointer-events-none');
    });

    it('should not be focusable when disabled', () => {
      render(<SportCard {...defaultProps} disabled={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Max Reached State', () => {
    it('should show reduced opacity when max reached and not selected', () => {
      render(<SportCard {...defaultProps} maxReached={true} selected={false} />);

      const card = screen.getByRole('button');
      expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should have correct aria-disabled when max reached', () => {
      render(<SportCard {...defaultProps} maxReached={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not be focusable when max reached', () => {
      render(<SportCard {...defaultProps} maxReached={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });
  });
});
