import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };

/** Themed text input, using the shared `.field` design token styles. */
export default function Input({ label, className = "", id, ...props }: InputProps) {
  const input = <input id={id} className={`field ${className}`} {...props} />;
  if (!label) return input;
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {input}
    </label>
  );
}
