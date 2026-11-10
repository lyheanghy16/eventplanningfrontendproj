import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { taskShape, userShape } from '../propTypes';
import { compareTasks } from '../utils/eventHelpers';
import EmptyState from './EmptyState';
import SegmentedControl from './SegmentedControl';
import TaskItem from './TaskItem';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

/** Sorted, filterable list of tasks (open first, soonest due first). */
export default function TaskList({
  tasks, usersById, eventsById, canEdit = false, canChangeStatus = () => false, onStatusChange = () => {}, onEdit = () => {}, onDelete = () => {}, emptyMessage = 'Nothing matches this filter.',
}) {
  const [filter, setFilter] = useState('all');
  const visible = useMemo(
    () => tasks.filter((t) => filter === 'all' || t.status === filter).sort(compareTasks),
    [tasks, filter],
  );

  return (
    <div>
      <SegmentedControl label="Filter tasks by status" options={FILTERS} value={filter} onChange={setFilter} />
      {visible.length === 0 ? (
        <EmptyState icon="✅" title="No tasks here">{emptyMessage}</EmptyState>
      ) : (
        <ul className="task-list">
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              assignee={usersById[task.assigneeId]}
              event={eventsById ? eventsById[task.eventId] : undefined}
              canEdit={canEdit}
              canChangeStatus={canChangeStatus(task)}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(taskShape).isRequired,
  usersById: PropTypes.objectOf(userShape).isRequired,
  eventsById: PropTypes.objectOf(PropTypes.object),
  canEdit: PropTypes.bool,
  canChangeStatus: PropTypes.func,
  onStatusChange: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  emptyMessage: PropTypes.string,
};

