import { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Label + control + hint + inline error, wired together for accessibility
 * (htmlFor/id, aria-invalid, aria-describedby, role="alert" on errors).
 *
 * Usage:
 *   <FormField label="Title" error={errors.title} required>
 *     {(controlProps) => <input {...controlProps} value=... onChange=... />}
 *   </FormField>
 */
export default function FormField({ label, error, hint, required = false, className = '', children }) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');
  const controlProps = {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy || undefined,
    'aria-required': required ? 'true' : undefined,
  };

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children(controlProps)}
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.func.isRequired,
};
