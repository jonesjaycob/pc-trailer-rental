import { auth } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-2">
        Hi, {session?.user?.name ?? session?.user?.email}
      </h1>
      <p className="text-muted-foreground mb-8">
        Your bookings and account will live here. Booking flow ships in Phase 2.
      </p>
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No bookings yet.
      </div>
    </div>
  );
}
