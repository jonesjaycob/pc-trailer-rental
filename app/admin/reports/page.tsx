import { defaultWindow, getSummary, getTrailerUtilization } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const window = defaultWindow();
  const [summary, utilization] = await Promise.all([
    getSummary(window),
    getTrailerUtilization(window),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          {window.startIso} → {window.endIso} ({window.days} days)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Revenue" value={formatCurrency(summary.revenue)} />
        <Stat label="Bookings" value={String(summary.count)} />
        <Stat label="Avg booking value" value={formatCurrency(summary.avgCents)} />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-display font-semibold">Utilization by trailer</h2>
          <p className="text-xs text-muted-foreground">
            Booked nights / days in period.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left p-3">Trailer</th>
              <th className="text-left p-3">Booked nights</th>
              <th className="text-left p-3">Revenue</th>
              <th className="text-left p-3">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {utilization.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No active trailers.
                </td>
              </tr>
            ) : (
              utilization.map((u) => (
                <tr key={u.trailerId} className="border-t">
                  <td className="p-3 font-medium">{u.trailerName}</td>
                  <td className="p-3 text-muted-foreground">{u.bookedNights}</td>
                  <td className="p-3">{formatCurrency(u.revenue)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-24 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, u.utilizationPct)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10">{u.utilizationPct}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
