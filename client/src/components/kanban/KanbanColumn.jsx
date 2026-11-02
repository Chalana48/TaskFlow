import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from '../tasks/TaskCard';

const COLUMN_CONFIG = {
  TODO: {
    title: 'To Do',
    dot: 'bg-slate-400',
    border: 'border-slate-800',
    headerBg: 'bg-slate-900/90',
  },
  IN_PROGRESS: {
    title: 'In Progress',
    dot: 'bg-blue-400',
    border: 'border-blue-900/40',
    headerBg: 'bg-blue-950/20',
  },
  IN_REVIEW: {
    title: 'In Review',
    dot: 'bg-purple-400',
    border: 'border-purple-900/40',
    headerBg: 'bg-purple-950/20',
  },
  DONE: {
    title: 'Done',
    dot: 'bg-emerald-400',
    border: 'border-emerald-900/40',
    headerBg: 'bg-emerald-950/20',
  },
};

export const KanbanColumn = ({
  status,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  canManage = false,
}) => {
  const config = COLUMN_CONFIG[status] || COLUMN_CONFIG.TODO;

  return (
    <div className={`flex flex-col rounded-3xl bg-slate-900/50 border ${config.border} p-4 min-w-[280px] w-full max-w-sm flex-1 shadow-lg`}>
      {/* Column Header */}
      <div className={`flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 rounded-2xl px-2 py-1.5 ${config.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {config.title}
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
            {tasks.length}
          </span>
        </div>

        {canManage && onAddTask && (
          <button
            type="button"
            onClick={() => onAddTask(status)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold"
            title={`Add task to ${config.title}`}
          >
            +
          </button>
        )}
      </div>

      {/* Droppable Container */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 min-h-[350px] p-1.5 rounded-2xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary-950/20 ring-2 ring-primary-500/30' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-2xl text-slate-500 text-xs">
                <span className="text-xl mb-1">📭</span>
                <span>No tasks</span>
              </div>
            ) : (
              tasks.map((task, index) => (
                <Draggable key={task._id} draggableId={task._id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`transform transition-transform ${
                        dragSnapshot.isDragging ? 'rotate-2 shadow-2xl ring-2 ring-primary-500/50' : ''
                      }`}
                    >
                      <TaskCard
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        canManage={canManage}
                        isDraggable={true}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
