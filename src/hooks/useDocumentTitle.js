import { useEffect } from 'react';

/** Sets and restores document.title for the lifetime of page components that call this hook. */
export default function useDocumentTitle(title) {
  // Set the page title on title changes and restore the previous title during cleanup.
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Gather` : 'Gather — Event Planning Portal';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
