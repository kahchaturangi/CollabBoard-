import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresence, formatLastSeen } from '../hooks/usePresence';
import * as socketModule from '../services/socket';

describe('usePresence Hook & Real-Time Presence System', () => {
  let mockSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    vi.spyOn(socketModule, 'connectSocket').mockReturnValue(mockSocket);
    vi.spyOn(socketModule.realtimeService, 'updatePresenceStatus').mockImplementation(() => {});
    vi.spyOn(socketModule.realtimeService, 'joinBoard').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats last seen correctly for online, away, and offline states', () => {
    expect(formatLastSeen(null, 'online')).toBe('Online');
    expect(formatLastSeen(null, 'away')).toBe('Away');

    const justNow = new Date(Date.now() - 10 * 1000);
    expect(formatLastSeen(justNow, 'offline')).toBe('Offline • Last seen just now');

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatLastSeen(fiveMinsAgo, 'offline')).toBe('Offline • Last seen 5m ago');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatLastSeen(twoHoursAgo, 'offline')).toBe('Offline • Last seen 2h ago');
  });

  it('starts with online status and registers presence listeners', () => {
    const setMembers = vi.fn();
    const { result } = renderHook(() => usePresence('board-test', setMembers, 1000));

    expect(result.current.myStatus).toBe('online');
    expect(mockSocket.on).toHaveBeenCalledWith('presence:sync', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('presence:update', expect.any(Function));
  });

  it('transitions from online to away after inactivity timeout', () => {
    const setMembers = vi.fn();
    const { result } = renderHook(() => usePresence('board-test', setMembers, 5000));

    expect(result.current.myStatus).toBe('online');

    // Fast-forward beyond inactivity threshold
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    expect(result.current.myStatus).toBe('away');
    expect(socketModule.realtimeService.updatePresenceStatus).toHaveBeenCalledWith('away');
  });
});
