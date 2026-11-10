import PropTypes from 'prop-types';
import Modal from './Modal';

/** Confirmation modal for destructive actions. Cancel is focused first for safety. */
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
