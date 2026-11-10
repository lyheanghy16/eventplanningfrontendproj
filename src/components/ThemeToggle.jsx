import { useTheme } from '../context/ThemeContext';

/** Dark-mode switch (a real toggle button with aria-pressed). */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="icon-btn icon-btn--bordered"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span aria-hidden="true">{dark ? '🌙' : '☀️'}</span>
    </button>
  );
}
