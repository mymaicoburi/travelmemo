"use client";

import { useEffect } from "react";
import { recordRecentTrip } from "./RecentTrips";

export default function VisitRecorder({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  useEffect(() => {
    recordRecentTrip({ slug, title });
  }, [slug, title]);
  return null;
}
