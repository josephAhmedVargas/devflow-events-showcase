"use client";

import { LiveEventClientView } from "@/components/live/LiveEventClientView";
import { LiveLockedNotice } from "@/components/live/LiveLockedNotice";
import { useDemoDb, useIsAdmin } from "@/demo/db";

export default function LivePage() {
  const db = useDemoDb();
  const isAdmin = useIsAdmin();

  const phase = db.event.phase;
  const isLivePhase = phase === "live" || phase === "event_day";
  const eventDate = new Date(db.event.eventDate || "2026-12-04T18:00:00-06:00");
  const isEventDayOrAfter = new Date() >= eventDate;

  // Misma regla que producción: admin, fase en vivo activada o día del evento
  if (!(isAdmin || isLivePhase || isEventDayOrAfter)) {
    return <LiveLockedNotice eventDate={eventDate} />;
  }

  return <LiveEventClientView isAdmin={isAdmin} />;
}
