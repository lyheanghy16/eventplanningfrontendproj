import PropTypes from 'prop-types';

/** Small status pill. Colour is never the only signal - the text always says what it is. */
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
