import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import * as socketModule from '../services/socket';

describe('useRealtimeSync Hook (Member 5 Socket & Concurrency)', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.spyOn(socketModule, 'connectSocket').mockReturnValue(mockSocket);
  });

  it('initializes socket and provides realtime functions', () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useRealtimeSync('board-123', setTasks));

    expect(result.current.conflict).toBeNull();
    expect(typeof result.current.moveTask).toBe('function');
    expect(typeof result.current.updateTask).toBe('function');
    expect(typeof result.current.createTask).toBe('function');
    expect(typeof result.current.deleteTask).toBe('function');
  });

  it('detects a conflict when socket move returns a conflict error', async () => {
    const setTasks = vi.fn();
    vi.spyOn(socketModule.realtimeService, 'moveTask').mockResolvedValue({
      success: false,
      error: 'conflict',
      task: { id: 't1', title: 'Task 1', version: 2, status: 'done' },
    });

    const { result } = renderHook(() => useRealtimeSync('board-123', setTasks));

    await act(async () => {
      await result.current.moveTask({ id: 't1', title: 'Task 1', version: 1 }, 'in_progress');
    });

    expect(result.current.conflict).not.toBeNull();
    expect(result.current.conflict.type).toBe('move');
    expect(result.current.conflict.server.version).toBe(2);
  });
});
