/**
 * TaskBoard: event tasks in draggable status columns with keyboard move buttons.
 * Used by EventDetail; TaskItem handles each task card and its available actions.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { taskShape, userShape } from '../propTypes';
import { TASK_STATUSES, compareTasks } from '../utils/eventHelpers';
import TaskItem from './TaskItem';

/**
 * Props: tasks/usersById supply board data; canEdit/canMove gate actions;
 * onMove/onEdit/onDelete delegate changes to the parent. Local state tracks active drag/target column.
 */
export default function TaskBoard({ tasks, usersById, canEdit = false, canMove, onMove, onEdit = () => {}, onDelete = () => {} }) {
  // Track drag feedback only; task state itself remains owned by EventContext.
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  function handleDragStart(event, task) {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(task.id);
  }

  function handleDrop(event, status) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || draggingId;
    const task = tasks.find((t) => t.id === id);
    setDraggingId(null);
    setOverColumn(null);
    if (task && task.status !== status && canMove(task)) onMove(task, status);
  }

  // Button-based move: direction -1 (left) or +1 (right).
  function moveBy(task, direction) {
    const index = TASK_STATUSES.findIndex((s) => s.id === task.status);
    const target = TASK_STATUSES[index + direction];
    if (target) onMove(task, target.id);
  }

  return (
    <div className="board">
      {TASK_STATUSES.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id).sort(compareTasks);
        const headingId = `board-col-${column.id}`;
        return (
          <section
            key={column.id}
            className={`board-column ${overColumn === column.id ? 'is-over' : ''}`}
            aria-labelledby={headingId}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overColumn !== column.id) setOverColumn(column.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null);
            }}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h3 id={headingId} className="board-heading">
              {column.label} <span className="tab-count">{columnTasks.length}</span>
            </h3>
            <ul className="board-list">
              {columnTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  variant="card"
                  task={task}
                  assignee={usersById[task.assigneeId]}
                  canEdit={canEdit}
                  canChangeStatus={canMove(task)}
                  draggable={canMove(task)}
                  isDragging={draggingId === task.id}
                  onDragStart={handleDragStart}
                  onDragEnd={() => { setDraggingId(null); setOverColumn(null); }}
                  onMove={moveBy}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {columnTasks.length === 0 && <li className="board-empty">Drop tasks here</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

TaskBoard.propTypes = {
  tasks: PropTypes.arrayOf(taskShape).isRequired,
  usersById: PropTypes.objectOf(userShape).isRequired,
  canEdit: PropTypes.bool,
  canMove: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

