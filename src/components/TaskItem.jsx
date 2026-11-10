import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { eventShape, taskShape, userShape } from '../propTypes';
import { TASK_PRIORITIES, TASK_STATUSES, formatDue, isTaskOverdue } from '../utils/eventHelpers';
import Avatar from './Avatar';
import Badge from './Badge';

const PRIORITY_TONE = { high: 'danger', medium: 'warn', low: 'neutral' };

/**
 * One task. `variant="row"` is used in lists (inline status select); `variant="card"` is used
 * on the Kanban board (draggable, with keyboard-friendly move buttons).
 */
export default function TaskItem({
  task, assignee, event, variant = 'row', canEdit = false, canChangeStatus = false,
  onStatusChange = () => {}, onEdit = () => {}, onDelete = () => {}, onMove = () => {}, draggable = false, isDragging = false, onDragStart = () => {}, onDragEnd = () => {},
}) {
  const overdue = isTaskOverdue(task);
  const statusIndex = TASK_STATUSES.findIndex((s) => s.id === task.status);
  const priority = TASK_PRIORITIES.find((p) => p.id === task.priority);
  const status = TASK_STATUSES[statusIndex];

  const classes = [
    'task',
    `task--${variant}`,
    overdue && 'is-overdue',
    task.status === 'done' && 'is-done',
    isDragging && 'is-dragging',
  ].filter(Boolean).join(' ');

  return (
    <li
      className={classes}
      draggable={draggable ? 'true' : undefined}
      onDragStart={draggable ? (e) => onDragStart(e, task) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      {variant === 'row' && (
        <div className="task-status">
          {canChangeStatus ? (
            <select
              value={task.status}
              aria-label={`Status of ${task.title}`}
              onChange={(e) => onStatusChange(task, e.target.value)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          ) : (
            <Badge tone={task.status === 'done' ? 'success' : 'neutral'}>{status.label}</Badge>
          )}
        </div>
      )}

      <div className="task-main">
        <p className="task-title">{task.title}</p>
        {event && (
          <p className="task-event">
            <Link to={`/events/${event.id}?tab=tasks`}>{event.title}</Link>
          </p>
        )}
        <div className="task-meta">
          <Badge tone={PRIORITY_TONE[task.priority]}>{priority.label}</Badge>
          <span className={`task-due ${overdue ? 'is-overdue' : ''}`}>
            {overdue && <strong>Overdue · </strong>}
            <span aria-hidden="true">📅</span> {formatDue(task)}
          </span>
          {assignee ? (
            <span className="person-inline">
              <Avatar name={assignee.name} color={assignee.avatarColor} size={20} /> {assignee.name}
            </span>
          ) : (
            <span className="muted">Unassigned</span>
          )}
        </div>
      </div>

      {(canEdit || (variant === 'card' && canChangeStatus)) && (
        <div className="task-actions">
          {variant === 'card' && canChangeStatus && (
            <>
              <button
                type="button"
                className="icon-btn icon-btn--bordered"
                disabled={statusIndex === 0}
                aria-label={`Move "${task.title}" to ${TASK_STATUSES[statusIndex - 1]?.label ?? 'previous column'}`}
                onClick={() => onMove(task, -1)}
              >
                ←
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--bordered"
                disabled={statusIndex === TASK_STATUSES.length - 1}
                aria-label={`Move "${task.title}" to ${TASK_STATUSES[statusIndex + 1]?.label ?? 'next column'}`}
                onClick={() => onMove(task, 1)}
              >
                →
              </button>
            </>
          )}
          {canEdit && (
            <>
              <button type="button" className="btn btn--ghost btn--sm" aria-label={`Edit task ${task.title}`} onClick={() => onEdit(task)}>
                Edit
              </button>
              <button type="button" className="btn btn--ghost btn--sm" aria-label={`Delete task ${task.title}`} onClick={() => onDelete(task)}>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

TaskItem.propTypes = {
  task: taskShape.isRequired,
  assignee: userShape,
  event: eventShape,
  variant: PropTypes.oneOf(['row', 'card']),
  canEdit: PropTypes.bool,
  canChangeStatus: PropTypes.bool,
  onStatusChange: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onMove: PropTypes.func,
  draggable: PropTypes.bool,
  isDragging: PropTypes.bool,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
};

