import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import taskService from '../../services/taskService';
import Alert from '../common/Alert';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export const KanbanBoard = ({
  tasks = [],
  onTasksChange,
  onAddTask,
  onEditTask,
  onDeleteTask,
  canManage = false,
}) => {
  const [error, setError] = useState('');

  // Handle Drag & Drop across columns
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Save previous copy for rollback in case of error
    const previousTasks = [...tasks];

    // Optimistically update local task state
    const updatedTasks = tasks.map((t) =>
      t._id === draggableId ? { ...t, status: newStatus } : t
    );
    onTasksChange(updatedTasks);
    setError('');

    // Persist to server
    try {
      await taskService.updateTaskStatus(draggableId, newStatus);
    } catch (err) {
      // Rollback to previous state on API failure
      onTasksChange(previousTasks);
      setError(
        err.message || 'Failed to update task status on the server. Change rolled back.'
      );
    }
  };

  // Group tasks by status
  const tasksByColumn = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 pt-2 custom-scrollbar min-h-[500px]">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByColumn[status] || []}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              canManage={canManage}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
