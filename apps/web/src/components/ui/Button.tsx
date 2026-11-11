import type { ButtonHTMLAttributes } from 'react';

export default function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded bg-[#1d9bf0] px-3 py-1.5 text-sm font-medium hover:bg-[#1a8cd8] disabled:opacity-50 ${className}`} {...props} />;
}
