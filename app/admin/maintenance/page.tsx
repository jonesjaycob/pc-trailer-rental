import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { maintenanceBlocks, trailers } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import { MaintenanceForm } from "@/components/admin/maintenance-form";
import { DeleteMaintenanceButton } from "@/components/admin/delete-maintenance-button";

export const metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const [allTrailers, blocks] = await Promise.all([
    db.select().from(trailers).orderBy(trailers.name),
    db
      .select({ block: maintenanceBlocks, trailer: trailers })
      .from(maintenanceBlocks)
      .innerJoin(trailers, eq(maintenanceBlocks.trailerId, trailers.id))
      .orderBy(asc(maintenanceBlocks.startDate)),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = blocks.filter((b) => b.block.endDate >= today);
  const past = blocks.filter((b) => b.block.endDate < today);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-6">Maintenance blocks</h1>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <BlockList title="Upcoming / active" blocks={upcoming} />
          {past.length > 0 && <BlockList title="Past" blocks={past} muted />}
        </div>
        <div className="rounded-lg border bg-card p-4 h-fit">
          <p className="font-semibold mb-3">Add a block</p>
          <MaintenanceForm trailers={allTrailers} />
        </div>
      </div>
    </div>
  );
}

function BlockList({
  title,
  blocks,
  muted,
}: {
  title: string;
  blocks: {
    block: typeof maintenanceBlocks.$inferSelect;
    trailer: typeof trailers.$inferSelect;
  }[];
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border p-6 text-center">
          None.
        </p>
      ) : (
        <ul className={"rounded-lg border bg-card divide-y " + (muted ? "opacity-70" : "")}>
          {blocks.map(({ block, trailer }) => (
            <li key={block.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{trailer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(block.startDate)} → {formatDate(block.endDate)}
                  {block.reason ? ` · ${block.reason}` : ""}
                </p>
              </div>
              <DeleteMaintenanceButton id={block.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
