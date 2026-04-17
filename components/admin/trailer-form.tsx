"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Trailer } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";

type Props = { trailer?: Trailer };

type FormState = {
  slug: string;
  name: string;
  type: "camp_trailer" | "flatbed";
  description: string;
  lengthFt: string;
  widthFt: string;
  gvwrLbs: string;
  emptyWeightLbs: string;
  tongueWeightLbs: string;
  requiredHitchClass: string;
  sleeps: string;
  dailyRate: string;
  weekendRate: string;
  weeklyRate: string;
  securityDeposit: string;
  bufferHours: string;
  minRentalDays: string;
  status: "active" | "maintenance" | "retired";
};

const dollarsToCents = (s: string) => Math.round(Number(s) * 100);
const centsToDollars = (c: number) => (c / 100).toFixed(2);

export function TrailerForm({ trailer }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    slug: trailer?.slug ?? "",
    name: trailer?.name ?? "",
    type: trailer?.type ?? "camp_trailer",
    description: trailer?.description ?? "",
    lengthFt: String(trailer?.lengthFt ?? ""),
    widthFt: String(trailer?.widthFt ?? ""),
    gvwrLbs: String(trailer?.gvwrLbs ?? ""),
    emptyWeightLbs: String(trailer?.emptyWeightLbs ?? ""),
    tongueWeightLbs: String(trailer?.tongueWeightLbs ?? ""),
    requiredHitchClass: trailer?.requiredHitchClass ?? "",
    sleeps: trailer?.sleeps != null ? String(trailer.sleeps) : "",
    dailyRate: trailer ? centsToDollars(trailer.dailyRateCents) : "",
    weekendRate: trailer ? centsToDollars(trailer.weekendRateCents) : "",
    weeklyRate: trailer ? centsToDollars(trailer.weeklyRateCents) : "",
    securityDeposit: trailer ? centsToDollars(trailer.securityDepositCents) : "",
    bufferHours: String(trailer?.bufferHours ?? 4),
    minRentalDays: String(trailer?.minRentalDays ?? 1),
    status: trailer?.status ?? "active",
  });
  const [photos, setPhotos] = useState<string[]>(trailer?.photos ?? []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingPhoto(true);
    setError("");

    const uploaded: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/uploads/trailer-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        break;
      }
      uploaded.push(data.url);
    }
    setPhotos((p) => [...p, ...uploaded]);
    setUploadingPhoto(false);
    e.target.value = "";
  }

  function removePhoto(url: string) {
    setPhotos((p) => p.filter((u) => u !== url));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      slug: form.slug,
      name: form.name,
      type: form.type,
      description: form.description,
      lengthFt: Number(form.lengthFt),
      widthFt: Number(form.widthFt),
      gvwrLbs: Number(form.gvwrLbs),
      emptyWeightLbs: Number(form.emptyWeightLbs),
      tongueWeightLbs: Number(form.tongueWeightLbs),
      requiredHitchClass: form.requiredHitchClass,
      sleeps: form.sleeps ? Number(form.sleeps) : null,
      dailyRateCents: dollarsToCents(form.dailyRate),
      weekendRateCents: dollarsToCents(form.weekendRate),
      weeklyRateCents: dollarsToCents(form.weeklyRate),
      securityDepositCents: dollarsToCents(form.securityDeposit),
      bufferHours: Number(form.bufferHours),
      minRentalDays: Number(form.minRentalDays),
      photos,
      status: form.status,
    };

    const url = trailer ? `/api/admin/trailers/${trailer.id}` : "/api/admin/trailers";
    const method = trailer ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }

    router.push("/admin/trailers");
    router.refresh();
  }

  async function retire() {
    if (!trailer) return;
    if (!confirm("Retire this trailer? It will stop appearing in the fleet.")) return;
    const res = await fetch(`/api/admin/trailers/${trailer.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/trailers");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <Section title="Basics">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Display name">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </Field>
          <Field label="Slug (URL)" hint="lowercase-with-hyphens">
            <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
          </Field>
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value as FormState["type"])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="camp_trailer">Camp trailer</option>
              <option value="flatbed">Flatbed</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as FormState["status"])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
      </Section>

      <Section title="Photos">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url) => (
            <div key={url} className="relative aspect-[4/3] rounded-md overflow-hidden border">
              <Image src={url} alt="" fill className="object-cover" sizes="200px" />
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
          <label className="aspect-[4/3] rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted text-muted-foreground text-xs">
            <Upload className="h-5 w-5 mb-1" />
            Upload
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
          </label>
        </div>
        {uploadingPhoto && <p className="text-xs text-muted-foreground mt-2">Uploading…</p>}
      </Section>

      <Section title="Specs">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Length (ft)">
            <Input type="number" value={form.lengthFt} onChange={(e) => update("lengthFt", e.target.value)} required />
          </Field>
          <Field label="Width (ft)">
            <Input type="number" value={form.widthFt} onChange={(e) => update("widthFt", e.target.value)} required />
          </Field>
          <Field label="Sleeps" hint="Leave blank for flatbed">
            <Input type="number" value={form.sleeps} onChange={(e) => update("sleeps", e.target.value)} />
          </Field>
          <Field label="GVWR (lb)">
            <Input type="number" value={form.gvwrLbs} onChange={(e) => update("gvwrLbs", e.target.value)} required />
          </Field>
          <Field label="Empty weight (lb)">
            <Input type="number" value={form.emptyWeightLbs} onChange={(e) => update("emptyWeightLbs", e.target.value)} required />
          </Field>
          <Field label="Tongue weight (lb)">
            <Input type="number" value={form.tongueWeightLbs} onChange={(e) => update("tongueWeightLbs", e.target.value)} required />
          </Field>
        </div>
        <Field label="Required hitch">
          <Input value={form.requiredHitchClass} onChange={(e) => update("requiredHitchClass", e.target.value)} required />
        </Field>
      </Section>

      <Section title="Pricing">
        <div className="grid md:grid-cols-4 gap-4">
          <Field label="Daily ($)">
            <Input type="number" step="0.01" value={form.dailyRate} onChange={(e) => update("dailyRate", e.target.value)} required />
          </Field>
          <Field label="Weekend ($)">
            <Input type="number" step="0.01" value={form.weekendRate} onChange={(e) => update("weekendRate", e.target.value)} required />
          </Field>
          <Field label="Weekly ($)">
            <Input type="number" step="0.01" value={form.weeklyRate} onChange={(e) => update("weeklyRate", e.target.value)} required />
          </Field>
          <Field label="Deposit ($)">
            <Input type="number" step="0.01" value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} required />
          </Field>
        </div>
      </Section>

      <Section title="Rental rules">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Buffer hours" hint="Time between rentals for cleaning/inspection">
            <Input type="number" value={form.bufferHours} onChange={(e) => update("bufferHours", e.target.value)} required />
          </Field>
          <Field label="Min rental days">
            <Input type="number" value={form.minRentalDays} onChange={(e) => update("minRentalDays", e.target.value)} required />
          </Field>
        </div>
      </Section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-between">
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : trailer ? "Save changes" : "Create trailer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        {trailer && trailer.status !== "retired" && (
          <Button type="button" variant="destructive" onClick={retire}>
            Retire trailer
          </Button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h2 className="font-display font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
