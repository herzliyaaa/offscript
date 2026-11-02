"use client";

import { useEffect, useRef } from "react";

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
    <div className="space-y-2">
      <span className="block text-center text-sm text-[#71767b]">
        Avatar {required && <span className="text-red-400" aria-hidden="true">*</span>}
      </span>
      <label
        htmlFor={id}
        className="relative mx-auto grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#536471] bg-[#101418] text-[#71767b] transition hover:border-[#1d9bf0] hover:text-[#1d9bf0]"
      >
        {preview ? (
          <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl font-light leading-none" aria-hidden="true">+</span>
        )}
        <span className="sr-only">Choose avatar image{required ? " (required)" : ""}</span>
      </label>
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
      <p className="text-center text-xs text-[#71767b]">
        Click the circle to upload a JPG, PNG, WebP, or GIF.
      </p>
    </div>
  );
}
