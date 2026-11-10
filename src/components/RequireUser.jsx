import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import EmptyState from './EmptyState';

/** Guards pages that need a signed-in (mock) user and offers one-click sign-in. */
export default function RequireUser({ children }) {
  const { currentUser, users, switchUser } = useAuth();
  const { status } = useEvents();

  if (status !== 'ready' || currentUser) return children;

  return (
    <div className="page">
      <EmptyState icon="🔐" title="Pick a user to continue">
        You are browsing as a public guest. Choose someone to act as:
        <span className="chip-row">
          {users.map((user) => (
            <button key={user.id} type="button" className="btn btn--sm" onClick={() => switchUser(user.id)}>
              {user.name}
            </button>
          ))}
        </span>
      </EmptyState>
    </div>
  );
}

RequireUser.propTypes = { children: PropTypes.node.isRequired };
