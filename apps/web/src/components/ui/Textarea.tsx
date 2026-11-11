import type { TextareaHTMLAttributes } from "react";

export default function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field min-h-20 resize-y leading-relaxed ${className}`} {...props} />;
}
