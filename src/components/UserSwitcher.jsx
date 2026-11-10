import { useId } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

/** Mock "who am I?" picker. Lets you test host / co-host / guest / signed-out views. */
export default function UserSwitcher() {
  const id = useId();
  const { currentUser, users, switchUser } = useAuth();

  return (
    <div className="user-switcher">
      {currentUser ? <Avatar name={currentUser.name} color={currentUser.avatarColor} size={28} /> : null}
      <label htmlFor={id} className="sr-only">Acting as</label>
      <select id={id} value={currentUser?.id || ''} onChange={(e) => switchUser(e.target.value)}>
        <option value="">Signed out (public guest)</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>{user.name}</option>
        ))}
      </select>
    </div>
  );
}
