export const metadata = { title: "Admin" };

export default function AdminHomePage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-2">Admin</h1>
      <p className="text-muted-foreground">
        Admin console ships in Phase 3 — master calendar, trailer CRUD, booking
        management, maintenance blocks, and reports.
      </p>
    </div>
  );
}
