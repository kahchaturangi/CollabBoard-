import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, GripVertical, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function TaskCard({ task, index, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const priorityClass =
    task.priority === 'high'
      ? 'priority-high'
      : task.priority === 'medium'
      ? 'priority-medium'
      : 'priority-low';

  const getInitials = (name) => {
    if (!name) return 'AR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAssigneeColor = (name) => {
    const initials = getInitials(name);
    if (initials === 'NK') return '#3b82f6';
    if (initials === 'AR') return '#f97316';
    if (initials === 'JD') return '#2563eb';
    if (initials === 'SC') return '#8b5cf6';
    return '#6366f1';
  };

  const renderTaskIllustration = () => {
    const titleLower = (task.title || '').toLowerCase();
    const idStr = String(task.id);

    if (idStr === 'task-1' || titleLower.includes('drag') || titleLower.includes('foundation')) {
      // 3D Clipboard Checklist Vector Graphic
      return (
        <div className="card-illustration illustration-clipboard">
          <svg viewBox="0 0 60 60" width="46" height="46" fill="none">
            <rect x="10" y="8" width="40" height="48" rx="8" fill="#e0f2fe" />
            <rect x="18" y="4" width="24" height="8" rx="3" fill="#3b82f6" />
            <rect x="16" y="20" width="18" height="4" rx="2" fill="#60a5fa" />
            <rect x="16" y="28" width="26" height="4" rx="2" fill="#93c5fd" />
            <rect x="16" y="36" width="22" height="4" rx="2" fill="#93c5fd" />
            <circle cx="42" cy="38" r="10" fill="#2563eb" />
            <path d="M37 38L40 41L47 34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    }

    if (idStr === 'task-2' || titleLower.includes('modal') || titleLower.includes('filter')) {
      // 3D Monitor / Filter UI Vector Graphic
      return (
        <div className="card-illustration illustration-monitor">
          <svg viewBox="0 0 60 60" width="46" height="46" fill="none">
            <rect x="6" y="10" width="48" height="34" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
            <rect x="22" y="44" width="16" height="8" fill="#93c5fd" />
            <rect x="14" y="52" width="32" height="4" rx="2" fill="#60a5fa" />
            <rect x="12" y="16" width="36" height="22" rx="4" fill="#ffffff" />
            <rect x="16" y="20" width="20" height="4" rx="2" fill="#3b82f6" />
            <rect x="16" y="28" width="14" height="4" rx="2" fill="#fbbf24" />
            <circle cx="40" cy="24" r="5" fill="#f97316" />
          </svg>
        </div>
      );
    }

    if (idStr === 'task-3' || titleLower.includes('api') || titleLower.includes('rest')) {
      // 3D Network Cloud Vector Graphic
      return (
        <div className="card-illustration illustration-cloud">
          <svg viewBox="0 0 60 60" width="46" height="46" fill="none">
            <path d="M18 32 C14 32 10 28 10 22 C10 17 14 13 19 13 C21 8 26 4 33 4 C40 4 45 9 46 15 C51 16 54 20 54 25 C54 31 49 32 44 32 Z" fill="#38bdf8" />
            <circle cx="18" cy="44" r="4" fill="#0284c7" />
            <circle cx="30" cy="46" r="4" fill="#0284c7" />
            <circle cx="42" cy="44" r="4" fill="#0284c7" />
            <line x1="30" y1="32" x2="30" y2="42" stroke="#0284c7" strokeWidth="2" />
            <line x1="30" y1="38" x2="18" y2="42" stroke="#0284c7" strokeWidth="2" />
            <line x1="30" y1="38" x2="42" y2="42" stroke="#0284c7" strokeWidth="2" />
          </svg>
        </div>
      );
    }

    if (idStr === 'task-4' || titleLower.includes('jwt') || titleLower.includes('auth') || titleLower.includes('security')) {
      // 3D Security Shield Vector Graphic
      return (
        <div className="card-illustration illustration-shield">
          <svg viewBox="0 0 60 60" width="46" height="46" fill="none">
            <path d="M30 6 L50 14 V28 C50 40 40 50 30 54 C20 50 10 40 10 28 V14 L30 6 Z" fill="#a855f7" />
            <rect x="23" y="24" width="14" height="12" rx="3" fill="#ffffff" />
            <path d="M26 24 V20 C26 17.8 27.8 16 30 16 C32.2 16 34 17.8 34 20 V24" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <circle cx="44" cy="42" r="9" fill="#22c55e" />
            <path d="M39 42L42 45L49 38" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    }

    if (idStr === 'task-5' || titleLower.includes('theme') || titleLower.includes('design')) {
      // 3D Color Palette & Paintbrush Graphic
      return (
        <div className="card-illustration illustration-palette">
          <svg viewBox="0 0 60 60" width="46" height="46" fill="none">
            <path d="M30 8 C16.7 8 6 18.7 6 32 C6 41.3 13.7 48 23 48 C25.8 48 28 45.8 28 43 C28 41.8 27.5 40.7 26.8 39.8 C26.1 38.8 25.7 37.7 25.7 36.5 C25.7 34 27.7 32 30.2 32 H34 C42.8 32 50 24.8 50 16 C44.5 11 37.6 8 30 8 Z" fill="#fdba74" />
            <circle cx="16" cy="24" r="3.5" fill="#ef4444" />
            <circle cx="26" cy="17" r="3.5" fill="#3b82f6" />
            <circle cx="38" cy="18" r="3.5" fill="#10b981" />
            <circle cx="44" cy="27" r="3.5" fill="#a855f7" />
            <path d="M34 38 L48 52 L53 47 L39 33 Z" fill="#2563eb" />
            <path d="M48 52 L54 54 L53 47 Z" fill="#1d4ed8" />
          </svg>
        </div>
      );
    }

    return null;
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
        >
          <div className="card-top-row">
            <div className="drag-handle-grip" {...provided.dragHandleProps} title="Drag card">
              <GripVertical size={16} color="#94a3b8" />
            </div>

            <div className="card-options-wrapper">
              <button
                type="button"
                className="action-icon-btn options-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                title="Options"
              >
                <MoreVertical size={16} color="#94a3b8" />
              </button>

              {showMenu && (
                <div className="card-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(task.id);
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card-body-layout">
            <div className="card-text-content">
              <h4 className="task-title">{task.title}</h4>
              {task.description && <p className="task-desc">{task.description}</p>}
            </div>
            {renderTaskIllustration()}
          </div>

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
              {(task.priority || 'medium').toUpperCase()}
            </span>

            <div className="card-footer-right">
              {task.dueDate && (
                <div className="due-date-badge">
                  <Calendar size={12} />
                  <span>{task.dueDate}</span>
                </div>
              )}

              {task.assignee && (
                <div
                  className="assignee-avatar"
                  style={{ backgroundColor: getAssigneeColor(task.assignee) }}
                  title={`Assigned to ${task.assignee}`}
                >
                  {getInitials(task.assignee)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

