"use client";

import { useEffect, useRef } from "react";
import { ImageIcon } from "@/components/ui/Icons";

type AvatarPickerProps = {
  id: string;
  preview: string;
  required?: boolean;
  onChange: (file: File, preview: string) => void;
  onError: (message: string) => void;
};

export default function AvatarPicker({
  id,
  preview,
  required = false,
  onChange,
  onError,
}: AvatarPickerProps) {
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function handleChange(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      onError("Avatar must be a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 1_500_000) {
      onError("Avatar must be smaller than 1.5 MB.");
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    onChange(file, objectUrl.current);
  }

  return (
    <div className="space-y-2.5">
      <span className="block text-center text-sm font-medium text-muted">
        Avatar {required && <span className="text-danger" aria-hidden="true">*</span>}
      </span>
      <label
        htmlFor={id}
        className="group relative mx-auto grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-line-strong bg-surface-2/60 text-subtle transition-all duration-300 hover:border-accent hover:shadow-[0_0_0_4px_var(--accent-soft)]"
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ImageIcon size={22} />
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <ImageIcon size={22} className="transition-transform duration-300 group-hover:scale-110 group-hover:text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Upload</span>
          </span>
        )}
        <span className="sr-only">Choose avatar image{required ? " (required)" : ""}</span>
      </label>
      <p className="text-center text-xs text-subtle">JPG, PNG, WebP, or GIF · up to 1.5 MB</p>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          handleChange(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
