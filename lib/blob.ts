import { put, del, type PutBlobResult } from "@vercel/blob";

export async function uploadBlob(
  pathname: string,
  data: Blob | File | ArrayBuffer | Buffer | ReadableStream,
  opts: { contentType?: string; access?: "public" } = {}
): Promise<PutBlobResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
  return put(pathname, data, {
    access: opts.access ?? "public",
    contentType: opts.contentType,
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function deleteBlob(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
