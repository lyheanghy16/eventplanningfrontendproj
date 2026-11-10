import { useEffect } from 'react';

/** Sets document.title for the lifetime of the calling page. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Gather` : 'Gather — Event Planning Portal';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
