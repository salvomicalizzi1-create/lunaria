'use client';

import { useId, useState } from 'react';

/**
 * One field. The label floats up to an eyebrow on focus, the underline grows
 * from the centre, and the error is tied to the input with aria-describedby so
 * a screen reader reads it as part of the field rather than as loose text.
 */
export function Field({
  label, value, onChange, onBlur, error, id: idProp,
  type = 'text', autoComplete, inputMode, required, hint, maxLength, name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  id?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  required?: boolean;
  hint?: string;
  /** only needed when the field is inside a form that posts itself */
  name?: string;
  maxLength?: number;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const [focused, setFocused] = useState(false);
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="fld" data-filled={value ? 'true' : undefined} data-error={error ? 'true' : undefined}>
      <label className="fld__label" htmlFor={id}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        className="fld__input"
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.() }}
      />
      <i className="fld__line" data-on={focused ? 'true' : undefined} aria-hidden="true" />
      {hint && <p className="fld__hint" id={hintId}>{hint}</p>}
      {error && <p className="fld__err" id={errId}>{error}</p>}
    </div>
  );
}

export default Field;
