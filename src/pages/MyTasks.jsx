import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import RequireUser from '../components/RequireUser';
import SegmentedControl from '../components/SegmentedControl';
import { SkeletonGrid } from '../components/Skeleton';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getRole, isTaskOverdue } from '../utils/eventHelpers';

/** Cross-event task list for the signed-in user, with overdue highlighting. */
export default function MyTasks() {
  useDocumentTitle('My tasks');
  return (
    <RequireUser>
      <MyTasksInner />
    </RequireUser>
  );
}

function MyTasksInner() {
  const toast = useToast();
  const { status, events, tasks, users, updateTask } = useEvents();
  const { currentUser } = useAuth();
  const [scope, setScope] = useState('mine');

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const eventsById = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === currentUser?.id && eventsById[t.eventId]),
    [tasks, currentUser?.id, eventsById],
  );
  const overdue = myTasks.filter((t) => isTaskOverdue(t));
  const open = myTasks.filter((t) => t.status !== 'done');

  const shown = useMemo(() => {
    if (scope === 'overdue') return overdue;
    if (scope === 'open') return open;
    return myTasks;
  }, [scope, myTasks, overdue, open]);

  // Assignees may always update the status of their own tasks.
  const canChangeStatus = (task) =>
    task.assigneeId === currentUser?.id || getRole(eventsById[task.eventId], currentUser?.id) !== 'guest';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My tasks</h1>
          <p className="muted">Everything assigned to {currentUser?.name} across all events.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat"><strong>{open.length}</strong><span>Open</span></div>
        <div className={`stat ${overdue.length ? 'stat--danger' : ''}`}><strong>{overdue.length}</strong><span>Overdue</span></div>
        <div className="stat"><strong>{myTasks.length - open.length}</strong><span>Done</span></div>
      </div>

      {overdue.length > 0 && (
        <p className="notice notice--warn" role="status">
          ⚠ You have {overdue.length} overdue task{overdue.length === 1 ? '' : 's'}.{' '}
          <button type="button" className="link-btn" onClick={() => setScope('overdue')}>Show overdue only</button>
        </p>
      )}

      <div className="toolbar">
        <SegmentedControl
          label="Task scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'mine', label: 'All mine' },
            { value: 'open', label: 'Open' },
            { value: 'overdue', label: 'Overdue' },
          ]}
        />
      </div>

      {status === 'loading' ? (
        <SkeletonGrid count={3} />
      ) : myTasks.length === 0 ? (
        <EmptyState icon="🎯" title="Nothing assigned to you" action={<Link to="/" className="btn">Browse events</Link>}>
          Tasks assigned to you will show up here.
        </EmptyState>
      ) : (
        <TaskList
          key={scope}
          tasks={shown}
          usersById={usersById}
          eventsById={eventsById}
          canChangeStatus={canChangeStatus}
          onStatusChange={(task, next) => {
            updateTask(task.id, { status: next });
            if (next === 'done') toast.success('Nice - task completed');
          }}
          emptyMessage={scope === 'overdue' ? 'You are all caught up. 🎉' : 'Nothing matches this filter.'}
        />
      )}
    </div>
  );
}
