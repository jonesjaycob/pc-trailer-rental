import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserApi } from "@/lib/rbac";
import { uploadBlob } from "@/lib/blob";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function POST(req: Request) {
  const guard = await requireUserApi();
  if (!guard.ok) return guard.response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const pathname = `drivers-licenses/${guard.user.id}/${Date.now()}.${ext}`;

  try {
    const blob = await uploadBlob(pathname, file, { contentType: file.type });
    await db
      .update(users)
      .set({ driversLicenseUrl: blob.url })
      .where(eq(users.id, guard.user.id));
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
