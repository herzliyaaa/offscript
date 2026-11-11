import type { TextareaHTMLAttributes } from 'react';

export default function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`w-full rounded border border-zinc-300 dark:border-[#38444d] bg-zinc-50 dark:bg-[#192734] p-2 text-sm text-zinc-900 dark:text-[#e7e9ea] ${className}`} {...props} />;
}
