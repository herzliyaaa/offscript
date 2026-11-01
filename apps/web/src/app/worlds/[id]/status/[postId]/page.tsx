import { Suspense } from "react";
import TweetDetailClient from "./TweetDetailClient";

export default function TweetDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading post…</div>}>
      <TweetDetailClient />
    </Suspense>
  );
}
