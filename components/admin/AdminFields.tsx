import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClass =
  "mt-2 w-full rounded-control border border-line/15 bg-line/[0.035] text-sm text-bone outline-none transition-colors duration-200 placeholder:text-bone/55 hover:border-line/25 focus:border-gold disabled:cursor-not-allowed disabled:opacity-50";

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <span className="flex items-start justify-between gap-3 text-xs font-medium text-bone/70">
      <span>
        {label}
        {required ? <span className="ml-1 text-gold">*</span> : null}
      </span>
      {hint ? <span className="font-normal text-bone/45">{hint}</span> : null}
    </span>
  );
}

type AdminFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string | number;
  onValueChange: (value: string) => void;
  hint?: string;
};

export function AdminField({ label, value, onValueChange, hint, required, className = "", ...props }: AdminFieldProps) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} required={required} hint={hint} />
      <input
        {...props}
        value={value}
        required={required}
        onChange={(event) => onValueChange(event.target.value)}
        className={`${controlClass} h-11 px-3`}
      />
    </label>
  );
}

type AdminTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
};

export function AdminTextArea({ label, value, onValueChange, hint, required, className = "", rows = 4, ...props }: AdminTextAreaProps) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} required={required} hint={hint} />
      <textarea
        {...props}
        value={value}
        required={required}
        rows={rows}
        onChange={(event) => onValueChange(event.target.value)}
        className={`${controlClass} resize-y px-3 py-3 leading-6`}
      />
    </label>
  );
}

type AdminSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  label: string;
  value: string | number;
  onValueChange: (value: string) => void;
  children: ReactNode;
  hint?: string;
};

export function AdminSelect({ label, value, onValueChange, children, hint, required, className = "", ...props }: AdminSelectProps) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} required={required} hint={hint} />
      <select
        {...props}
        value={value}
        required={required}
        onChange={(event) => onValueChange(event.target.value)}
        className={`${controlClass} h-11 px-3`}
      >
        {children}
      </select>
    </label>
  );
}

export function AdminColorField({ label, value, onValueChange }: { label: string; value: string; onValueChange: (value: string) => void }) {
  return (
    <div className="block">
      <FieldLabel label={label} required />
      <span className={`${controlClass} flex h-11 items-center gap-3 px-2`}>
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(event) => onValueChange(event.target.value)}
          aria-label={`${label}颜色选择器`}
          className="size-7 shrink-0 cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          required
          pattern="#[0-9a-fA-F]{6}"
          placeholder="#debd87"
          aria-label={`${label}十六进制色值`}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase text-bone outline-none placeholder:text-bone/55"
        />
      </span>
    </div>
  );
}

export function AdminToggle({ label, description, checked, onChange, disabled = false }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex min-h-14 cursor-pointer items-center justify-between gap-5 rounded-control border border-line/12 bg-line/[0.025] px-4 py-3 ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-line/25"}`}>
      <span>
        <span className="block text-sm font-medium text-bone">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-bone/55">{description}</span> : null}
      </span>
      <span className="relative h-6 w-11 shrink-0">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full border border-line/20 bg-line/10 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold" />
        <span className="absolute left-1 top-1 size-4 rounded-full bg-bone transition-transform peer-checked:translate-x-5 peer-checked:bg-ink" />
      </span>
    </label>
  );
}

export function AdminStatus({ message, error, busyLabel }: { message?: string; error?: string; busyLabel?: string }) {
  const text = error || busyLabel || message;
  if (!text) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-control border px-4 py-3 text-sm leading-6 ${error ? "border-red-300/20 bg-red-400/10 text-red-200" : "border-gold/20 bg-gold/[0.08] text-gold"}`}
    >
      {text}
    </p>
  );
}
