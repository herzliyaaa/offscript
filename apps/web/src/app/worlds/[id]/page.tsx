import { Suspense } from 'react';
import WorldClient from './WorldClient';
import LoadingState from '@/components/LoadingState';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading world…" />}>
      <WorldClient />
    </Suspense>
  );
}
