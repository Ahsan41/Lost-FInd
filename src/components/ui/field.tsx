import type { ReactNode } from "react";

interface FieldProps {
  children: ReactNode;
  error?: string;
  /** Short guidance shown under the label. Rendered with id `${htmlFor}-hint`. */
  hint?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}

export function Field({
  children,
  error,
  hint,
  htmlFor,
  label,
  required = false,
}: FieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required
          ? <span aria-hidden="true" className="field-required">*</span>
          : <span className="field-optional">Optional</span>}
      </label>
      {hint && <p className="field-hint" id={`${htmlFor}-hint`}>{hint}</p>}
      {children}
      {error && <p className="field-error" id={`${htmlFor}-error`} role="alert">{error}</p>}
    </div>
  );
}

/** Joins the ids a control should reference in `aria-describedby`. */
export function describedBy(htmlFor: string, options: { error?: string; hint?: string }): string | undefined {
  const ids = [
    options.hint ? `${htmlFor}-hint` : null,
    options.error ? `${htmlFor}-error` : null,
  ].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}
