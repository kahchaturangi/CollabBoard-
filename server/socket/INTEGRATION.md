# Real-Time Layer — Integration Notes (Member 5)

## What's here
- `server/socket/socketServer.js` — Socket.io server: JWT-authenticated
  connections, board rooms, `task:create/update/move/delete` events, and
  optimistic-concurrency conflict detection via a `version` counter on `Task`.
- `client/src/services/socket.js` — connection singleton + promise-wrapped emits.
- `client/src/hooks/useRealtimeSync.js` — React hook that joins a board room,
  merges broadcasts into task state, and surfaces conflicts.
- `client/src/components/ConflictBanner.jsx` — UI for a rejected/conflicting write.

## Wiring into App.jsx (for whoever owns App.jsx state)
```jsx
import { useRealtimeSync } from './hooks/useRealtimeSync';
import ConflictBanner from './components/ConflictBanner';

// inside App(), once you have a real boardId (not the mock data):
const { conflict, clearConflict, moveTask, updateTask, createTask, deleteTask } =
  useRealtimeSync(boardId, setTasks);

// swap the REST-only calls in handleDragEnd / handleSaveTask / handleDeleteTask
// for the socket equivalents above, e.g.:
//   await moveTask(draggedTask, newStatus)
//   await updateTask(taskToEdit, taskData)
//   await createTask(taskData)
//   await deleteTask(task)
//
// Each task object must carry the `version` field the server returned, so
// task:create / initial fetch responses need to include it (Member 3/4 — the
// Task model already returns `version` since it's on the schema now).

// render once, near the top of the board view:
<ConflictBanner conflict={conflict} onDismiss={clearConflict} />
```

## Coordination needed with the rest of the team
1. **Member 3 (Task API):** once `/api/tasks` CRUD exists, GET should return
   the `version` field so the client has something to compare against.
2. **Member 3/4 (id shape):** client code still keys off `task.id` (mock data),
   but Mongo returns `_id`. `useRealtimeSync` already normalizes this
   (`_id || id`) on the socket side — worth normalizing the same way in
   `api.js` / components so REST and socket data behave identically.
3. **Member 6 (tests):** `handleVersionedWrite` in `socketServer.js` is the
   core conflict-detection logic and is a good target for a Jest+Supertest-
   style test (mock two clients writing to the same task, assert the second
   gets `{ success: false, error: 'conflict' }`).

## Manual test
1. `npm install` in both `server/` and `client/` (adds `socket.io` /
   `socket.io-client`).
2. Run the server, open the board in two browser tabs (or two logged-in users).
3. Drag/edit the same task in both tabs quickly — the second write should
   show the conflict banner instead of silently overwriting the first.
