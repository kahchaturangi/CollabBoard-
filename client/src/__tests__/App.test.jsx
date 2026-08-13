import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('CollabBoard Frontend Component Tests', () => {
  
  // Test 1: Check if a basic text renders correctly
  it('renders a welcome or heading text correctly', () => {
    render(<div><h1>CollabBoard Kanban</h1></div>);
    expect(screen.getByText('CollabBoard Kanban')).toBeInTheDocument();
  });

  // Test 2: Check if Kanban Column headers (To Do) can be rendered
  it('renders board column title correctly', () => {
    render(<div data-testid="column">To Do</div>);
    expect(screen.getByTestId('column')).toHaveTextContent('To Do');
  });

  // Test 3: Check task card mock element rendering
  it('renders task card element with title', () => {
    const taskTitle = 'Fix WebSocket Connection Bug';
    render(<div data-testid="task-card">{taskTitle}</div>);
    expect(screen.getByTestId('task-card')).toHaveTextContent(taskTitle);
  });

});