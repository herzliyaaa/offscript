"use client";

import { CheckIcon } from "@/components/ui/Icons";

type Option<T extends string | number> = {
  value: T;
  label: string;
};

type OptionPillsProps<T extends string | number> = {
  label?: string;
  value: T;
  options: readonly Option<T>[];
  required?: boolean;
  onChange: (value: T) => void;
};

export default function OptionPills<T extends string | number>({
  label,
  value,
  options,
  required = false,
  onChange,
}: OptionPillsProps<T>) {
  return (
    <fieldset className="space-y-2">
      {label && (
        <legend className="text-sm font-medium text-muted">
          {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
        </legend>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              type="button"
              key={String(option.value)}
              aria-pressed={selected}
              className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                selected
                  ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_2px_10px_rgba(139,92,246,0.35)]"
                  : "border-line bg-surface-2/60 text-muted hover:border-line-strong hover:text-foreground"
              }`}
              onClick={() => onChange(option.value)}
            >
              {selected && <CheckIcon size={13} strokeWidth={3} />}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
