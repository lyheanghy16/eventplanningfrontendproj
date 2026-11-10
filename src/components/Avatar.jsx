import PropTypes from 'prop-types';

const FALLBACK_COLORS = ['#4f46e5', '#0284c7', '#db2777', '#b45309', '#047857', '#7c3aed'];

function hashColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Decorative initials avatar (the person's name is always rendered as text nearby). */
export default function Avatar({ name, color, size = 32 }) {
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: color || hashColor(name || ''),
      }}
    >
      {initials(name || '')}
    </span>
  );
}

Avatar.propTypes = {
  name: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.number,
};
