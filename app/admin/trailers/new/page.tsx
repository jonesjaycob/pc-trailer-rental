import { TrailerForm } from "@/components/admin/trailer-form";

export const metadata = { title: "New trailer" };

export default function NewTrailerPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Add trailer</h1>
      <TrailerForm />
    </div>
  );
}
