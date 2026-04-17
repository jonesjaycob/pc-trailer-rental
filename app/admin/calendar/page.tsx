import { MasterCalendar } from "@/components/admin/master-calendar";

export const metadata = { title: "Calendar" };

export default function AdminCalendarPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Master calendar</h1>
          <p className="text-muted-foreground">
            All bookings and maintenance blocks, color-coded by trailer.
          </p>
        </div>
      </div>
      <MasterCalendar />
    </div>
  );
}
