import { useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { isTaskOverdue } from '../utils/eventHelpers';
import ThemeToggle from './ThemeToggle';
import UserSwitcher from './UserSwitcher';

/** Site header: brand, primary navigation, theme toggle and the mock user switcher. */
export default function Navbar() {
  const { currentUser } = useAuth();
  const { tasks } = useEvents();

  const overdueCount = useMemo(
    () => (currentUser ? tasks.filter((t) => t.assigneeId === currentUser.id && isTaskOverdue(t)).length : 0),
    [tasks, currentUser],
  );

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          <span aria-hidden="true">🎉</span> Gather
        </Link>

        <nav aria-label="Main" className="main-nav">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/calendar" className={linkClass}>Calendar</NavLink>
          <NavLink to="/tasks" className={linkClass}>
            My Tasks
            {overdueCount > 0 && (
              <span className="nav-badge" title={`${overdueCount} overdue`}>
                {overdueCount}
                <span className="sr-only"> overdue tasks</span>
              </span>
            )}
          </NavLink>
        </nav>

        <div className="header-tools">
          <ThemeToggle />
          <UserSwitcher />
        </div>
      </div>
    </header>
  );
}
