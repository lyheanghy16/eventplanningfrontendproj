import { useState } from 'react';
import PropTypes from 'prop-types';
import { commentShape, eventShape, userShape } from '../propTypes';
import { formatTimeAgo } from '../utils/dateHelpers';
import { ROLE_LABELS, ROLES, canDeleteComment, getRole } from '../utils/eventHelpers';
import Avatar from './Avatar';
import Badge from './Badge';
import EmptyState from './EmptyState';
import FormField from './FormField';

const MAX_LENGTH = 1000;

/** Discussion thread. Signed-in users can post; authors and hosts/co-hosts can delete. */
export default function CommentThread({ event, comments, usersById, currentUser = null, onAdd, onDelete }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const role = getRole(event, currentUser?.id);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Write something before posting.');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Comments are limited to ${MAX_LENGTH} characters.`);
      return;
    }
    onAdd(trimmed);
    setText('');
    setError('');
  }

  const ordered = [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="comments">
      {ordered.length === 0 ? (
        <EmptyState icon="💬" title="No comments yet">
          Start the conversation - ask a question or share an update.
        </EmptyState>
      ) : (
        <ul className="comment-list">
          {ordered.map((comment) => {
            const author = usersById[comment.userId];
            const authorRole = getRole(event, comment.userId);
            return (
              <li key={comment.id} className="comment">
                <Avatar name={author?.name || 'Unknown'} color={author?.avatarColor} size={34} />
                <div className="comment-body">
                  <p className="comment-head">
                    <strong>{author?.name || 'Unknown user'}</strong>
                    {authorRole !== ROLES.GUEST && <Badge tone="primary">{ROLE_LABELS[authorRole]}</Badge>}
                    <time className="muted small" dateTime={comment.createdAt}>{formatTimeAgo(comment.createdAt)}</time>
                  </p>
                  <p className="comment-text">{comment.text}</p>
                </div>
                {canDeleteComment(role, comment, currentUser?.id) && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    aria-label={`Delete comment by ${author?.name || 'unknown user'}`}
                    onClick={() => onDelete(comment)}
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {currentUser ? (
        <form onSubmit={handleSubmit} noValidate className="comment-form">
          <FormField label={`Comment as ${currentUser.name}`} error={error} hint={`${text.length}/${MAX_LENGTH}`}>
            {(p) => (
              <textarea
                {...p}
                rows={3}
                value={text}
                onChange={(e) => { setText(e.target.value); if (error) setError(''); }}
                placeholder="Add a comment…"
              />
            )}
          </FormField>
          <div className="form-actions form-actions--start">
            <button type="submit" className="btn btn--primary">Post comment</button>
          </div>
        </form>
      ) : (
        <p className="notice notice--info">Use the user switcher in the header to sign in and join the discussion.</p>
      )}
    </div>
  );
}

CommentThread.propTypes = {
  event: eventShape.isRequired,
  comments: PropTypes.arrayOf(commentShape).isRequired,
  usersById: PropTypes.objectOf(userShape).isRequired,
  currentUser: userShape,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

