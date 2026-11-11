import type { SelectHTMLAttributes } from "react";
import { ChevronRightIcon } from "@/components/ui/Icons";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

/** Themed select with a custom gradient chevron affordance. */
export default function Select({ label, className = "", id, children, ...props }: SelectProps) {
  const select = (
    <span className="relative block">
      <select id={id} className={`field appearance-none pr-9 ${className}`} {...props}>
        {children}
      </select>
      <ChevronRightIcon
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-subtle"
      />
    </span>
  );
  if (!label) return select;
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {select}
    </label>
  );
}
