import { Suspense } from "react";
import MessagesClient from "./MessagesClient";

export default function MessagesPage() {
  return <Suspense fallback={<div className="p-8 text-zinc-400">Loading messages…</div>}><MessagesClient /></Suspense>;
}
