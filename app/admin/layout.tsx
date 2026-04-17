import { requireAdmin } from "@/lib/rbac";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: { default: "Admin", template: "%s — Admin | Pell City Trailer Rentals" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-[calc(100vh-4rem-6rem)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 bg-muted/30">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
