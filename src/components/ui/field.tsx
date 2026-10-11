import type { ReactNode } from "react";

interface FieldProps {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}

export function Field({
  children,
  error,
  htmlFor,
  label,
  required = false,
}: FieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}{required && <span className="field-required"> *</span>}
      </label>
      {children}
      {error && <p className="field-error" id={`${htmlFor}-error`} role="alert">{error}</p>}
    </div>
  );
}
