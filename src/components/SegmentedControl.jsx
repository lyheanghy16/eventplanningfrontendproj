/**
 * SegmentedControl: accessible single-choice buttons for filters and view selection.
 * Used by Dashboard, CalendarPage, EventDetail, AttendeeList, TaskList, and MyTasks.
 */
import PropTypes from 'prop-types';

/**
 * Props: label names the group, options defines its choices, value is selected, and onChange reports selection.
 * Each option uses aria-pressed so state is conveyed without relying on color.
 */
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented-btn ${option.value === value ? 'is-active' : ''}`}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

SegmentedControl.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
