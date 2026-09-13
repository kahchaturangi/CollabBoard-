import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket, realtimeService } from '../services/socket';

const DEFAULT_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Format a lastSeen date into a human readable string
 * e.g. "Last seen just now", "Last seen 5 min ago", "Last seen 2h ago"
 */
export function formatLastSeen(lastSeenDate, status) {
  if (status === 'online') return 'Online';
  if (status === 'away') return 'Away';
  if (!lastSeenDate) return 'Offline';

  try {
    const last = new Date(lastSeenDate).getTime();
    if (isNaN(last)) return 'Offline';

    const diffSec = Math.floor((Date.now() - last) / 1000);
    if (diffSec < 60) return 'Offline • Last seen just now';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Offline • Last seen ${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Offline • Last seen ${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `Offline • Last seen ${diffDays}d ago`;
  } catch (e) {
    return 'Offline';
  }
}

/**
 * Custom hook for real-time member presence and client inactivity tracking
 */
export function usePresence(boardId, setMembers, inactivityMs = DEFAULT_INACTIVITY_MS) {
  const [myStatus, setMyStatus] = useState('online');
  const [presences, setPresences] = useState(new Map());
  const myStatusRef = useRef('online');
  const inactivityTimerRef = useRef(null);

  // Helper to emit status to server
  const sendStatus = useCallback((status) => {
    myStatusRef.current = status;
    setMyStatus(status);
    realtimeService.updatePresenceStatus(status);
  }, []);

  // Inactivity tracking (mouse, key, scroll, touch, click)
  useEffect(() => {
    const resetInactivityTimer = () => {
      // If we were away, switch back to online immediately
      if (myStatusRef.current === 'away') {
        sendStatus('online');
      }

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        if (myStatusRef.current === 'online') {
          sendStatus('away');
        }
      }, inactivityMs);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttled listener to avoid unnecessary calls on every mouse move
    let lastEventTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastEventTime > 1000) {
        lastEventTime = now;
        resetInactivityTimer();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [inactivityMs, sendStatus]);

  // Socket presence event listeners
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    // Handle full presence sync from server
    const handleSync = (data) => {
      if (!data || !Array.isArray(data.presences)) return;
      setPresences((prev) => {
        const next = new Map(prev);
        data.presences.forEach((p) => {
          if (p && p.userId) {
            next.set(String(p.userId), {
              status: p.status || 'online',
              lastSeen: p.lastSeen || new Date(),
            });
          }
        });
        return next;
      });

      // Also merge into members state if setMembers is provided
      if (typeof setMembers === 'function') {
        setMembers((prevMembers) => {
          const map = new Map(data.presences.map((p) => [String(p.userId), p]));
          return prevMembers.map((m) => {
            const mid = String(m.id || m._id);
            const live = map.get(mid);
            if (live) {
              return {
                ...m,
                status: live.status,
                online: live.status === 'online',
                lastSeen: live.lastSeen,
              };
            }
            return m;
          });
        });
      }
    };

    // Handle individual or broadcast presence update
    const handleUpdate = (data) => {
      if (!data) return;
      const targetUserId = data.userId ? String(data.userId) : null;
      const targetStatus = data.status || 'online';
      const targetLastSeen = data.lastSeen || new Date();

      if (targetUserId) {
        setPresences((prev) => {
          const next = new Map(prev);
          next.set(targetUserId, {
            status: targetStatus,
            lastSeen: targetLastSeen,
          });
          return next;
        });

        if (typeof setMembers === 'function') {
          setMembers((prevMembers) => {
            return prevMembers.map((m) => {
              const mid = String(m.id || m._id);
              if (mid === targetUserId) {
                return {
                  ...m,
                  status: targetStatus,
                  online: targetStatus === 'online',
                  lastSeen: targetLastSeen,
                };
              }
              return m;
            });
          });
        }
      }
    };

    // Reconnection listener
    const handleReconnect = () => {
      if (boardId) {
        realtimeService.joinBoard(boardId);
        sendStatus('online');
      }
    };

    socket.on('presence:sync', handleSync);
    socket.on('presence:update', handleUpdate);
    socket.on('user:online', handleUpdate);
    socket.on('user:away', handleUpdate);
    socket.on('user:offline', handleUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('presence:sync', handleSync);
      socket.off('presence:update', handleUpdate);
      socket.off('user:online', handleUpdate);
      socket.off('user:away', handleUpdate);
      socket.off('user:offline', handleUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [boardId, setMembers, sendStatus]);

  return {
    myStatus,
    presences,
    sendStatus,
    formatLastSeen,
  };
}
