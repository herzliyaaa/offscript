import { Suspense } from 'react';
import WorldClient from './WorldClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading world…</div>}>
      <WorldClient />
    </Suspense>
  );
}
