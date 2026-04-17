"use client";

import { useCallback, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  url?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: Record<string, unknown>;
};

type LegendTrailer = { id: string; name: string; color: string };

export function MasterCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [legend, setLegend] = useState<LegendTrailer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRange = useCallback(async (start: string, end: string) => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
      setLegend(data.trailers);
    }
    setLoading(false);
  }, []);

  // Initial load for current month ±1
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10);
    fetchRange(start, end);
  }, [fetchRange]);

  return (
    <div className="space-y-4">
      {legend.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {legend.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: t.color }}
                aria-hidden
              />
              <span className="text-muted-foreground">{t.name}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: "#d0d0d0" }}
              aria-hidden
            />
            <span className="text-muted-foreground">Maintenance</span>
          </span>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          events={events}
          eventDisplay="block"
          datesSet={(arg) => {
            const start = arg.startStr.slice(0, 10);
            const end = arg.endStr.slice(0, 10);
            fetchRange(start, end);
          }}
        />
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
    </div>
  );
}
