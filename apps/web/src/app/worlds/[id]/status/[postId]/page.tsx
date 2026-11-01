import { Suspense } from "react";
import TweetDetailClient from "./TweetDetailClient";
import LoadingState from "@/components/LoadingState";

export default function TweetDetailPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading post…" />}>
      <TweetDetailClient />
    </Suspense>
  );
}
