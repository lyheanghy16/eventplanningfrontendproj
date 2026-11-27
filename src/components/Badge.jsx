/**
 * Badge: compact text status indicator with a tone-based visual treatment.
 * Used by event, RSVP, and task components; its children provide the status meaning.
 */
import PropTypes from 'prop-types';

/**
 * Props: tone selects the style, children supplies the visible label, and title adds an optional tooltip.
 * Text remains visible so color is never the only status signal.
 */
export default function Badge({ tone = 'neutral', children, title }) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.oneOf(['neutral', 'primary', 'success', 'warn', 'danger']),
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
};
