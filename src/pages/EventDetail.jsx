import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AttendeeList from '../components/AttendeeList';
import Badge from '../components/Badge';
import CoHostManager from '../components/CoHostManager';
import CommentThread from '../components/CommentThread';
import ConfirmDialog from '../components/ConfirmDialog';
import Countdown from '../components/Countdown';
import CopyLinkButton from '../components/CopyLinkButton';
import EmptyState from '../components/EmptyState';
import EventForm from '../components/EventForm';
import Modal from '../components/Modal';
import RSVPForm from '../components/RSVPForm';
import { PageSkeleton } from '../components/Skeleton';
import SegmentedControl from '../components/SegmentedControl';
import Tabs from '../components/Tabs';
import TaskBoard from '../components/TaskBoard';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatEventRange } from '../utils/dateHelpers';
import { downloadICS, slugify } from '../utils/icsExport';
import {
  ROLE_LABELS, ROLES, can, canChangeTaskStatus, getCoverStyle, getEventStats, getLocationLabel, getRole,
  isEventPast, isTaskOverdue,
} from '../utils/eventHelpers';

/**
 * Event workspace at /events/:id. What you see depends on your role:
 *   Host      - everything, including delete and co-host management
 *   Co-host   - edit event, attendees, tasks, moderate comments
 *   Guest     - details, RSVP, comments (tasks and attendee list are hidden)
 */
export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    status, events, rsvps, tasks, comments, users, updateEvent, deleteEvent, duplicateEvent, removeRsvp,
    addTask, updateTask, deleteTask, addComment, deleteComment,
  } = useEvents();
  const { currentUser } = useAuth();

  const event = events.find((e) => e.id === id);
  useDocumentTitle(event?.title);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [taskDialog, setTaskDialog] = useState(null); // { task? } when open
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [rsvpToRemove, setRsvpToRemove] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [taskView, setTaskView] = useState('board');

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const eventRsvps = useMemo(() => rsvps.filter((r) => r.eventId === id), [rsvps, id]);
  const stats = useMemo(() => (event ? getEventStats(event, eventRsvps) : null), [event, eventRsvps]);
  const eventTasks = useMemo(() => tasks.filter((t) => t.eventId === id), [tasks, id]);
  const eventComments = useMemo(() => comments.filter((c) => c.eventId === id), [comments, id]);

  if (status === 'loading') return <PageSkeleton />;
  if (!event) {
    return (
      <div className="page">
        <EmptyState icon="🧭" title="Event not found" action={<Link to="/" className="btn btn--primary">Back to dashboard</Link>}>
          It may have been deleted, or the link is incorrect.
        </EmptyState>
      </div>
    );
  }

  const role = getRole(event, currentUser?.id);
  const isMember = role !== ROLES.GUEST;
  const past = isEventPast(event);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(can(role, 'attendees:view') ? [{ id: 'attendees', label: 'Attendees', count: stats.going.length + stats.waitlist.length + stats.maybe.length }] : []),
    ...(can(role, 'task:view') ? [{ id: 'tasks', label: 'Tasks', count: eventTasks.filter((t) => t.status !== 'done').length }] : []),
    { id: 'comments', label: 'Comments', count: eventComments.length },
  ];
  const requested = searchParams.get('tab');
  const activeTab = tabs.some((t) => t.id === requested) ? requested : 'overview';
  const setTab = (tab) => setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true });

  /* ------------------------------ handlers ------------------------------ */
  function handleEdit(values) {
    updateEvent(event.id, values);
    setEditing(false);
    toast.success('Event updated');
  }

  function handleDelete() {
    deleteEvent(event.id);
    toast.success(`"${event.title}" deleted`);
    navigate('/');
  }

  function handleDuplicate() {
    const copy = duplicateEvent(event.id, currentUser.id);
    toast.success('Event duplicated - scheduled one week later');
    navigate(`/events/${copy.id}`);
  }

  function handleSaveTask(values) {
    if (taskDialog.task) {
      updateTask(taskDialog.task.id, values);
      toast.success('Task updated');
    } else {
      addTask(event.id, values);
      toast.success('Task added');
    }
    setTaskDialog(null);
  }

  const canChangeStatus = (task) => canChangeTaskStatus(role, task, currentUser?.id);
  const handleTaskStatus = (task, nextStatus) => {
    if (task.status !== nextStatus) updateTask(task.id, { status: nextStatus });
  };

  const overdue = eventTasks.filter((t) => isTaskOverdue(t)).length;

  return (
    <div className="page">
      <Link to="/" className="back-link">← All events</Link>

      <div className="hero" style={getCoverStyle(event)}>
        <div className="hero-overlay">
          <div className="badge-row">
            {isMember && <Badge tone="primary">{ROLE_LABELS[role]}</Badge>}
            <Badge>{event.visibility === 'private' ? '🔒 Private' : '🌐 Public'}</Badge>
            {past && <Badge>Past event</Badge>}
            {stats.isFull && !past && <Badge tone="warn">Full</Badge>}
          </div>
          <h1>{event.title}</h1>
          <p>{formatEventRange(event.start, event.end)}</p>
        </div>
      </div>

      <div className="action-bar" role="toolbar" aria-label="Event actions">
        <CopyLinkButton eventId={event.id} label="Copy share link" className="btn" />
        <Link to={`/event/${event.id}`} className="btn">View public page</Link>
        <button type="button" className="btn" onClick={() => downloadICS([event], `${slugify(event.title)}.ics`)}>
          Export .ics
        </button>
        {can(role, 'event:edit') && <button type="button" className="btn" onClick={() => setEditing(true)}>Edit</button>}
        {can(role, 'event:duplicate') && <button type="button" className="btn" onClick={handleDuplicate}>Duplicate</button>}
        {can(role, 'event:delete') && (
          <button type="button" className="btn btn--danger-outline" onClick={() => setConfirmDelete(true)}>Delete</button>
        )}
      </div>

      <Tabs label="Event sections" tabs={tabs} active={activeTab} onChange={setTab} />

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="tab-panel">
        {/* ----------------------------- overview ----------------------------- */}
        {activeTab === 'overview' && (
          <div className="two-col">
            <section aria-labelledby="about-h">
              <h2 id="about-h">About</h2>
              {!past && <Countdown start={event.start} end={event.end} />}
              <dl className="detail-list">
                <div><dt>When</dt><dd>{formatEventRange(event.start, event.end)}</dd></div>
                <div>
                  <dt>Where</dt>
                  <dd>
                    {getLocationLabel(event)}
                    {event.locationType === 'virtual' && event.link && (
                      <> – <a href={event.link} target="_blank" rel="noreferrer noopener">Join link</a></>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Host</dt>
                  <dd>
                    {usersById[event.hostId]?.name || 'Unknown'}
                    {event.coHostIds.length > 0 && ` · Co-hosts: ${event.coHostIds.map((c) => usersById[c]?.name).filter(Boolean).join(', ')}`}
                  </dd>
                </div>
                <div>
                  <dt>Capacity</dt>
                  <dd>
                    {stats.capacity > 0 ? `${stats.seatsTaken} of ${stats.capacity} seats taken` : `${stats.seatsTaken} going · unlimited`}
                    {stats.waitlist.length > 0 && ` · ${stats.waitlist.length} on waitlist`}
                  </dd>
                </div>
              </dl>
              {event.description && <p className="description">{event.description}</p>}

              {isMember && overdue > 0 && (
                <p className="notice notice--warn">⚠ {overdue} task{overdue === 1 ? ' is' : 's are'} overdue for this event.</p>
              )}
              {role === ROLES.HOST && (
                <CoHostManager
                  key={event.coHostIds.join(',')}
                  event={event}
                  users={users}
                  onSave={(ids) => { updateEvent(event.id, { coHostIds: ids }); toast.success('Co-hosts updated'); }}
                />
              )}
            </section>

            <section aria-labelledby="rsvp-h" className="card">
              <h2 id="rsvp-h">RSVP</h2>
              {past ? (
                <p className="muted">This event has ended, so RSVPs are closed.</p>
              ) : (
                <RSVPForm key={currentUser?.id || 'anon'} event={event} user={currentUser} />
              )}
            </section>
          </div>
        )}

        {/* ---------------------------- attendees ----------------------------- */}
        {activeTab === 'attendees' && (
          <AttendeeList
            event={event}
            stats={stats}
            canRemove={can(role, 'attendees:remove')}
            onRemove={setRsvpToRemove}
          />
        )}

        {/* ------------------------------ tasks ------------------------------- */}
        {activeTab === 'tasks' && (
          <div>
            <div className="section-head">
              <SegmentedControl
                label="Task view"
                value={taskView}
                onChange={setTaskView}
                options={[{ value: 'board', label: 'Board' }, { value: 'list', label: 'List' }]}
              />
              {can(role, 'task:create') && (
                <button type="button" className="btn btn--primary" onClick={() => setTaskDialog({})}>+ Add task</button>
              )}
            </div>

            {eventTasks.length === 0 ? (
              <EmptyState icon="📝" title="No tasks yet">Break the work down - add the first task for this event.</EmptyState>
            ) : taskView === 'board' ? (
              <TaskBoard
                tasks={eventTasks}
                usersById={usersById}
                canEdit={can(role, 'task:edit')}
                canMove={canChangeStatus}
                onMove={handleTaskStatus}
                onEdit={(task) => setTaskDialog({ task })}
                onDelete={setTaskToDelete}
              />
            ) : (
              <TaskList
                tasks={eventTasks}
                usersById={usersById}
                canEdit={can(role, 'task:edit')}
                canChangeStatus={canChangeStatus}
                onStatusChange={handleTaskStatus}
                onEdit={(task) => setTaskDialog({ task })}
                onDelete={setTaskToDelete}
              />
            )}
          </div>
        )}

        {/* ----------------------------- comments ----------------------------- */}
        {activeTab === 'comments' && (
          <CommentThread
            event={event}
            comments={eventComments}
            usersById={usersById}
            currentUser={currentUser}
            onAdd={(text) => { addComment(event.id, currentUser.id, text); toast.success('Comment posted'); }}
            onDelete={setCommentToDelete}
          />
        )}
      </div>

      {/* ------------------------------ dialogs ------------------------------ */}
      {editing && (
        <Modal title="Edit event" onClose={() => setEditing(false)} size="lg">
          <EventForm event={event} submitLabel="Save changes" onSubmit={handleEdit} onCancel={() => setEditing(false)} />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this event?"
          message={`"${event.title}" and all of its RSVPs, tasks and comments will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {taskDialog && (
        <Modal title={taskDialog.task ? 'Edit task' : 'Add task'} onClose={() => setTaskDialog(null)}>
          <TaskForm
            task={taskDialog.task}
            users={users}
            submitLabel={taskDialog.task ? 'Save task' : 'Add task'}
            onSubmit={handleSaveTask}
            onCancel={() => setTaskDialog(null)}
          />
        </Modal>
      )}

      {taskToDelete && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${taskToDelete.title}" will be removed.`}
          onConfirm={() => { deleteTask(taskToDelete.id); setTaskToDelete(null); toast.success('Task deleted'); }}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {rsvpToRemove && (
        <ConfirmDialog
          title="Remove attendee?"
          message={`${rsvpToRemove.name} will be removed from the list. If a seat opens up, the next person on the waitlist is promoted.`}
          confirmLabel="Remove"
          onConfirm={() => { removeRsvp(rsvpToRemove.id); setRsvpToRemove(null); toast.success('Attendee removed'); }}
          onCancel={() => setRsvpToRemove(null)}
        />
      )}

      {commentToDelete && (
        <ConfirmDialog
          title="Delete comment?"
          message="This comment will be removed for everyone."
          onConfirm={() => { deleteComment(commentToDelete.id); setCommentToDelete(null); toast.success('Comment deleted'); }}
          onCancel={() => setCommentToDelete(null)}
        />
      )}
    </div>
  );
}
