import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { taskShape, userShape } from '../propTypes';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/eventHelpers';
import FormField from './FormField';

/** Returns { field: message } for invalid fields. Exported for tests. */
export function validateTask(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Task title is required.';
  else if (values.title.trim().length > 120) errors.title = 'Title must be 120 characters or fewer.';
  if (values.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) errors.dueDate = 'Enter a valid date.';
  return errors;
}

/** Add / edit a task: title, assignee, due date, priority and status. */
export default function TaskForm({ task, users, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    title: task?.title || '',
    assigneeId: task?.assigneeId || '',
    dueDate: task?.dueDate || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);

  const errors = useMemo(() => validateTask(values), [values]);
  const shown = (name) => (submitted || touched[name] ? errors[name] : undefined);
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    onSubmit({
      title: values.title.trim(),
      assigneeId: values.assigneeId || null,
      dueDate: values.dueDate,
      priority: values.priority,
      status: values.status,
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-grid">
      <FormField label="Task" required error={shown('title')} className="span-2">
        {(p) => <input {...p} type="text" maxLength={140} value={values.title} onChange={set('title')} onBlur={blur('title')} placeholder="e.g. Book the DJ" />}
      </FormField>

      <FormField label="Assignee">
        {(p) => (
          <select {...p} value={values.assigneeId} onChange={set('assigneeId')}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </FormField>

      <FormField label="Due date" error={shown('dueDate')}>
        {(p) => <input {...p} type="date" value={values.dueDate} onChange={set('dueDate')} onBlur={blur('dueDate')} />}
      </FormField>

      <FormField label="Priority">
        {(p) => (
          <select {...p} value={values.priority} onChange={set('priority')}>
            {TASK_PRIORITIES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
      </FormField>

      <FormField label="Status">
        {(p) => (
          <select {...p} value={values.status} onChange={set('status')}>
            {TASK_STATUSES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
      </FormField>

      <div className="form-actions span-2">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
      </div>
    </form>
  );
}

TaskForm.propTypes = {
  task: taskShape,
  users: PropTypes.arrayOf(userShape).isRequired,
  submitLabel: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

