/**
 * NewEventPage: standalone create-event form for the active account.
 * Routed at /events/new; AuthContext supplies its owner and EventContext persists the event.
 */
import { useNavigate } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

/** Creates an event for currentUser, then opens its workspace. */
export default function NewEventPage() {
  useDocumentTitle('Create event');
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { createEvent } = useEvents();

  function handleCreate(values) {
    const created = createEvent(values, currentUser.id);
    toast.success(`"${created.title}" created`);
    navigate(`/events/${created.id}`);
  }

  return (
    <div className="page page--narrow">
      <h1>Create event</h1>
      <div className="card">
        <EventForm submitLabel="Create event" onSubmit={handleCreate} onCancel={() => navigate('/dashboard')} />
      </div>
    </div>
  );
}
