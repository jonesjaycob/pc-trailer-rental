"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/booking/signature-pad";
import { Upload, X } from "lucide-react";

type Props = {
  bookingId: string;
  type: "pickup" | "return";
};

export function InspectionForm({ bookingId, type }: Props) {
  const router = useRouter();
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("Full");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");

    const uploaded: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bookingId", bookingId);
      const res = await fetch("/api/admin/uploads/inspection-photo", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        break;
      }
      uploaded.push(data.url);
    }
    setPhotos((p) => [...p, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(url: string) {
    setPhotos((p) => p.filter((u) => u !== url));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch(`/api/admin/bookings/${bookingId}/inspection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        mileageOrHours: mileage ? Number(mileage) : undefined,
        fuelLevel: fuelLevel || undefined,
        notes: notes || undefined,
        photoUrls: photos,
        signatureDataUrl: signature ?? undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    router.push(`/admin/bookings/${bookingId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <p className="font-semibold">Condition</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Mileage / hours (optional)</Label>
            <Input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Fuel level</Label>
            <select
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>Full</option>
              <option>3/4</option>
              <option>1/2</option>
              <option>1/4</option>
              <option>Empty</option>
              <option>N/A</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe condition, any damage, wear, or items provided."
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="font-semibold">Photos</p>
        <p className="text-xs text-muted-foreground">
          Document exterior, tires, lights, and any existing damage.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square rounded-md overflow-hidden border">
              <Image src={url} alt="" fill className="object-cover" sizes="150px" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 bg-background/90 rounded-md p-1 hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted text-muted-foreground text-xs">
            <Upload className="h-4 w-4 mb-1" />
            Add
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              onChange={uploadPhotos}
              disabled={uploading}
            />
          </label>
        </div>
        {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
      </div>

      <div className="rounded-lg border bg-card p-5">
        <p className="font-semibold mb-2">Customer signature (optional)</p>
        <p className="text-xs text-muted-foreground mb-3">
          Have the renter sign below to confirm the {type === "pickup" ? "pickup" : "return"}{" "}
          condition.
        </p>
        <SignaturePad onChange={setSignature} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} size="lg">
        {submitting
          ? "Saving…"
          : `Record ${type === "pickup" ? "pickup" : "return"} inspection`}
      </Button>
    </form>
  );
}
