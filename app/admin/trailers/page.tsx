import Link from "next/link";
import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata = { title: "Trailers" };

export default async function AdminTrailersPage() {
  const list = await db.select().from(trailers).orderBy(trailers.createdAt);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Trailers</h1>
        <Button asChild>
          <Link href="/admin/trailers/new">
            <Plus className="h-4 w-4" />
            Add trailer
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Daily</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 text-muted-foreground">
                  {t.type === "camp_trailer" ? "Camp" : "Flatbed"}
                </td>
                <td className="p-3">{formatCurrency(t.dailyRateCents)}</td>
                <td className="p-3">
                  <Badge
                    variant={
                      t.status === "active"
                        ? "default"
                        : t.status === "maintenance"
                          ? "accent"
                          : "secondary"
                    }
                  >
                    {t.status}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/trailers/${t.id}`}
                    className="text-primary text-sm hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
