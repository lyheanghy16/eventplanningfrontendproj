/**
 * Countdown: presents an event's upcoming, live, or ended state.
 * Used on EventDetail and PublicEvent; useCountdown supplies the changing time values.
 */
import PropTypes from 'prop-types';
import useCountdown from '../hooks/useCountdown';

/**
 * Props: start/end are ISO date strings defining the event interval.
 * The useCountdown hook owns the one-second clock update.
 */
export default function Countdown({ start, end }) {
  const countdown = useCountdown(start, end);

  if (countdown.status === 'ended') {
    return <p className="countdown countdown--state">This event has ended.</p>;
  }
  if (countdown.status === 'live') {
    return (
      <p className="countdown countdown--state countdown--live">
        <span className="live-dot" aria-hidden="true" /> Happening now
      </p>
    );
  }

  const units = [
    ['Days', countdown.days],
    ['Hours', countdown.hours],
    ['Min', countdown.minutes],
    ['Sec', countdown.seconds],
  ];
  const spoken = `Starts in ${countdown.days} days, ${countdown.hours} hours and ${countdown.minutes} minutes`;

  return (
    <div className="countdown" role="timer" aria-label={spoken}>
      {units.map(([label, value]) => (
        <div key={label} className="countdown-unit" aria-hidden="true">
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

Countdown.propTypes = {
  start: PropTypes.string.isRequired,
  end: PropTypes.string.isRequired,
};
