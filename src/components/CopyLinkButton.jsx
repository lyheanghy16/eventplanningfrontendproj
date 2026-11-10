import PropTypes from 'prop-types';
import { useToast } from '../context/ToastContext';
import { buildEventUrl } from '../utils/eventHelpers';

/** Copies the public share URL (/event/:id) to the clipboard. */
export default function CopyLinkButton({ eventId, label = 'Copy link', className = 'btn btn--ghost btn--sm' }) {
  const toast = useToast();

  async function copy() {
    const url = buildEventUrl(eventId);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      // Fallback for insecure contexts / older browsers.
      try {
        const input = document.createElement('textarea');
        input.value = url;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand('copy');
        input.remove();
        if (!ok) throw new Error('copy failed');
        toast.success('Link copied to clipboard');
      } catch {
        toast.error(`Could not copy automatically. Link: ${url}`);
      }
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      <span aria-hidden="true">🔗</span> {label}
    </button>
  );
}

CopyLinkButton.propTypes = {
  eventId: PropTypes.string.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
};
