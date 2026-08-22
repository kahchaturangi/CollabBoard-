import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Shown when this client's edit/move/delete was rejected because someone
 * else changed the same task first (version mismatch).
 *
 * `onKeepServerVersion`  - accept the server's copy, discard the local change
 * `onDismiss`            - close the banner without changing anything (the
 *                           server broadcast already updated the board, so
 *                           the user just needs to be told and can re-apply
 *                           their edit manually if still relevant)
 */
export default function ConflictBanner({ conflict, onDismiss }) {
  if (!conflict) return null;

  const { type, server } = conflict;

  const actionLabel = {
    move: 'move this task',
    update: 'edit this task',
    delete: 'delete this task',
  }[type];

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        margin: '10px 20px',
        borderRadius: '8px',
        background: '#3f2d0f',
        border: '1px solid #f59e0b',
        color: '#fde68a',
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '14px' }}>
        Someone else updated <strong>{server?.title || 'this task'}</strong> while you tried to{' '}
        {actionLabel}. The board now shows their latest version — please re-apply your change if
        it's still needed.
      </span>
      <button
        onClick={onDismiss}
        style={{
          padding: '6px 12px',
          background: '#f59e0b',
          color: '#1f1300',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Got it
      </button>
    </div>
  );
}
