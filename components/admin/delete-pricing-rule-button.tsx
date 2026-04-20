"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeletePricingRuleButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("Delete this pricing rule?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/pricing-rules/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={del}
      disabled={busy}
      aria-label="Delete"
      className="h-8 w-8"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
