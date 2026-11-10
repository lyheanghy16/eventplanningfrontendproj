import PropTypes from 'prop-types';

/** Friendly placeholder for empty lists, missing items and signed-out screens. */
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
