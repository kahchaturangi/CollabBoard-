import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';

export default function KanbanBoard({
  columns,
  tasks,
  onDragEnd,
  onEditTask,
  onDeleteTask,
  onQuickAddTask,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board-container">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          return (
            <Column
              key={column.id}
              column={column}
              tasks={columnTasks}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onQuickAddTask={onQuickAddTask}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
