/**
 * ConfirmDialog: modal confirmation for actions that remove or change data.
 * Used by EventDetail; confirmation and cancellation are delegated through callbacks.
 */
import PropTypes from 'prop-types';
import Modal from './Modal';

/**
 * Props: title/message describe the action, confirmLabel/danger style the primary action,
 * and onConfirm/onCancel handle the user's choice. The cancel action receives initial focus.
 */
export default function ConfirmDialog({
  title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p>{message}</p>
      <div className="form-actions">
        <button type="button" className="btn" data-autofocus onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.node.isRequired,
  confirmLabel: PropTypes.string,
  danger: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
