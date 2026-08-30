import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ConflictBanner from '../components/ConflictBanner';

describe('ConflictBanner Component (Member 5 Concurrency Alert)', () => {
  it('renders nothing when conflict is null', () => {
    const { container } = render(<ConflictBanner conflict={null} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders conflict banner when a concurrent update conflict occurs', () => {
    const conflict = {
      type: 'update',
      local: { id: 'task-1', title: 'Edit Task 1', version: 1 },
      server: { id: 'task-1', title: 'Edit Task 1 (Server)', version: 2 },
    };
    render(<ConflictBanner conflict={conflict} onDismiss={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Someone else updated/i)).toBeInTheDocument();
    expect(screen.getByText(/Edit Task 1 \(Server\)/i)).toBeInTheDocument();
  });

  it('calls onDismiss when Got it button is clicked', () => {
    const onDismissMock = vi.fn();
    const conflict = {
      type: 'move',
      local: { id: 'task-2', title: 'Drag Task', version: 1 },
      server: { id: 'task-2', title: 'Drag Task', version: 2 },
    };
    render(<ConflictBanner conflict={conflict} onDismiss={onDismissMock} />);

    const button = screen.getByRole('button', { name: /Got it/i });
    fireEvent.click(button);
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });
});
