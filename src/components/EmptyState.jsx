/**
 * EmptyState: reusable illustration, title, explanation, and optional action for empty views.
 * Used across pages and lists when there is nothing to display or an item is unavailable.
 */
import PropTypes from 'prop-types';

/**
 * Props: icon/title/children provide the message and action adds an optional next step.
 * Renders children and action only when supplied.
 */
export default function EmptyState({ icon = '📭', title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  action: PropTypes.node,
};
