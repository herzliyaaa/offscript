import { Suspense } from "react";
import MessagesClient from "./MessagesClient";
import LoadingState from "@/components/LoadingState";

export default function MessagesPage() {
  return <Suspense fallback={<LoadingState label="Loading messages…" />}><MessagesClient /></Suspense>;
}
