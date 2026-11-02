import { Suspense } from "react";
import LoadingState from "@/components/LoadingState";
import NotificationsClient from "./NotificationsClient";

export default function Page() {
  return <Suspense fallback={<LoadingState label="Loading notifications…" />}><NotificationsClient /></Suspense>;
}
