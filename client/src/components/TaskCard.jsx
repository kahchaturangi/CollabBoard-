import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Edit2, Trash2, Calendar, User } from 'lucide-react';

export default function TaskCard({ task, index, onEdit, onDelete }) {
  const priorityClass =
    task.priority === 'high'
      ? 'priority-high'
      : task.priority === 'medium'
      ? 'priority-medium'
      : 'priority-low';

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
        >
          <div className="card-header">
            <h4 className="task-title">{task.title}</h4>
            <div className="card-actions">
              <button
                className="action-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                title="Edit Task"
              >
                <Edit2 size={14} />
              </button>
              <button
                className="action-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                title="Delete Task"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {task.description && <p className="task-desc">{task.description}</p>}

          {task.tags && task.tags.length > 0 && (
            <div className="card-tags">
              {task.tags.map((tag, i) => (
                <span key={i} className="tag-badge">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="card-footer">
            <span className={`priority-badge ${priorityClass}`}>
              {task.priority || 'medium'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {task.dueDate && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Calendar size={12} />
                  <span>{task.dueDate}</span>
                </div>
              )}

              {task.assignee && (
                <div className="assignee-group" title={`Assigned to ${task.assignee}`}>
                  <div className="assignee-avatar">{getInitials(task.assignee)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
