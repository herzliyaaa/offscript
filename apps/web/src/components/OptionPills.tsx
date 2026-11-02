"use client";

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
        <legend className="text-sm text-[#71767b]">
          {label} {required && <span className="text-red-400" aria-hidden="true">*</span>}
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
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-[#1d9bf0] bg-[#1d9bf0] text-white"
                  : "border-[#38444d] bg-[#101418] text-[#b8c0c7] hover:border-[#1d9bf0]"
              }`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
