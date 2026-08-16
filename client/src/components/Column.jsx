import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

export default function Column({ column, tasks, onEditTask, onDeleteTask, onQuickAddTask }) {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className="column-title-group">
          <span className={`column-indicator ${column.colorIndicator}`}></span>
          <h3 className="column-title">{column.title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button
          className="action-icon-btn"
          onClick={() => onQuickAddTask(column.id)}
          title="Add task to column"
        >
          <Plus size={16} />
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
    </div>
  );
}
