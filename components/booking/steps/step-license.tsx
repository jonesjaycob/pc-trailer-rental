"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import type { WizardState } from "../booking-wizard";

type Props = {
  state: WizardState;
  onBack: () => void;
  onNext: (patch: Partial<WizardState>) => void;
};

export function StepLicense({ state, onBack, onNext }: Props) {
  const [url, setUrl] = useState(state.driversLicenseUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/uploads/drivers-license", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <p className="font-medium">Upload your driver&apos;s license</p>
        <p className="text-sm text-muted-foreground mt-1">
          Front of your physical license. Photo must be clear and fully legible.
          Stored securely and only used to verify at pickup.
        </p>
      </div>

      {url ? (
        <div className="rounded-lg border p-3 bg-card">
          <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-secondary">
            <Image
              src={url}
              alt="Driver's license preview"
              fill
              className="object-contain"
              sizes="500px"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Uploaded. You can re-upload below to replace it.
          </p>
        </div>
      ) : null}

      <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-secondary/50 transition-colors">
        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
        <span className="text-sm font-medium">
          {url ? "Upload a different photo" : "Upload license photo"}
        </span>
        <span className="text-xs text-muted-foreground mt-1">JPEG, PNG, or HEIC — up to 8MB</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          onChange={onFileChange}
          disabled={uploading}
        />
      </label>

      {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ driversLicenseUrl: url })}
          disabled={!url || uploading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
