import type { ReactNode } from 'react';

export default function NavigationItem({ label, icon, active, onClick }: { label: string; icon: ReactNode; active?: boolean; onClick: () => void }) {
  return <button className={`flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10 ${active ? 'font-bold' : ''}`} onClick={onClick}><span aria-hidden="true">{icon}</span><span>{label}</span></button>;
}
