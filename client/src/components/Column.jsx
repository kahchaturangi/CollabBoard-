import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus, Check, Shield, CircleDot, Sparkles } from 'lucide-react';

export default function Column({ column, tasks, onEditTask, onDeleteTask, onQuickAddTask }) {
  const getHeaderIcon = () => {
    switch (column.id) {
      case 'todo':
        return (
          <div className="column-icon icon-todo">
            <CircleDot size={14} color="#0284c7" />
          </div>
        );
      case 'in_progress':
        return (
          <div className="column-icon icon-in_progress">
            <Sparkles size={14} color="#d97706" />
          </div>
        );
      case 'review':
        return (
          <div className="column-icon icon-review">
            <Shield size={14} color="#9333ea" />
          </div>
        );
      case 'done':
        return (
          <div className="column-icon icon-done">
            <Check size={14} color="#16a34a" strokeWidth={3} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`kanban-column column-${column.id}`}>
      <div className="column-header">
        <div className="column-title-group">
          {getHeaderIcon()}
          <h3 className="column-title">{column.title}</h3>
          <span className={`task-count count-${column.id}`}>{tasks.length}</span>
        </div>
        <button
          className={`action-icon-btn btn-add-col btn-col-${column.id}`}
          onClick={() => onQuickAddTask(column.id)}
          title="Add task to column"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Decorative Wave & Illustration at Bottom of Column */}
      <div className="column-wave-footer">
        {column.id === 'todo' && (
          <svg className="wave-svg" viewBox="0 0 320 100" fill="none" preserveAspectRatio="none">
            <path d="M0 40 Q80 80 160 50 T320 60 V100 H0 Z" fill="#93c5fd" fillOpacity="0.35" />
            <path d="M0 60 Q100 30 200 70 T320 50 V100 H0 Z" fill="#60a5fa" fillOpacity="0.25" />
            <rect x="20" y="45" width="40" height="45" rx="6" fill="#ffffff" fillOpacity="0.7" />
            <line x1="28" y1="58" x2="52" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="28" y1="66" x2="48" y2="66" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="28" y1="74" x2="40" y2="74" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}

        {column.id === 'in_progress' && (
          <svg className="wave-svg" viewBox="0 0 320 100" fill="none" preserveAspectRatio="none">
            <path d="M0 50 Q120 20 220 60 T320 40 V100 H0 Z" fill="#fde047" fillOpacity="0.35" />
            <path d="M0 70 Q90 40 180 80 T320 60 V100 H0 Z" fill="#f59e0b" fillOpacity="0.2" />
          </svg>
        )}

        {column.id === 'review' && (
          <svg className="wave-svg" viewBox="0 0 320 120" fill="none" preserveAspectRatio="none">
            <path d="M0 50 Q100 90 200 40 T320 70 V120 H0 Z" fill="#d8b4fe" fillOpacity="0.4" />
            <path d="M0 75 Q120 40 220 85 T320 60 V120 H0 Z" fill="#c084fc" fillOpacity="0.25" />
            <g transform="translate(195, 45)">
              <circle cx="28" cy="28" r="22" fill="#ffffff" fillOpacity="0.9" />
              <circle cx="28" cy="28" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3.5" />
              <line x1="38" y1="38" x2="52" y2="52" stroke="#8b5cf6" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M22 25 L26 29 L34 21" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </svg>
        )}

        {column.id === 'done' && (
          <div className="completed-illustration-container">
            <svg className="wave-svg" viewBox="0 0 320 120" fill="none" preserveAspectRatio="none">
              <path d="M0 60 Q90 20 180 70 T320 45 V120 H0 Z" fill="#6ee7b7" fillOpacity="0.4" />
              <path d="M0 80 Q100 45 200 85 T320 65 V120 H0 Z" fill="#34d399" fillOpacity="0.3" />
            </svg>
            <div className="confetti-graphic">
              <span className="confetti c1"></span>
              <span className="confetti c2"></span>
              <span className="confetti c3"></span>
              <span className="confetti c4"></span>
              <span className="confetti c5"></span>
              <span className="confetti c6"></span>
              <span className="confetti c7"></span>
              <div className="big-checkmark-circle">
                <Check size={36} color="#ffffff" strokeWidth={3.5} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

