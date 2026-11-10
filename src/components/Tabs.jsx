import { useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * WAI-ARIA tablist with roving tabindex and arrow/Home/End key support.
 * The parent renders the matching panel with id `panel-<tab id>` and
 * aria-labelledby `tab-<tab id>`.
 */
export default function Tabs({ label, tabs, active, onChange }) {
  const refs = useRef({});

  function onKeyDown(event) {
    const index = tabs.findIndex((t) => t.id === active);
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => { refs.current[tab.id] = el; }}
          id={`tab-${tab.id}`}
          type="button"
          role="tab"
          className={`tab ${tab.id === active ? 'is-active' : ''}`}
          aria-selected={tab.id === active}
          aria-controls={`panel-${tab.id}`}
          tabIndex={tab.id === active ? 0 : -1}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count != null && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

Tabs.propTypes = {
  label: PropTypes.string.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    }),
  ).isRequired,
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
