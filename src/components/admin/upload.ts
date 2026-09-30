"use client";

import { startMediaUpload, uploadMediaDirect } from "@/app/actions/admin-catalog";
import type { MediaBucket } from "@/lib/admin/catalog-store";
import { putToSignedUrl } from "@/lib/storage/upload-client";

/** Uploads to storage directly when possible (no size limit from the server in between). */
export async function uploadAdminMedia(file: File, bucket: MediaBucket, folder: string): Promise<{ path: string; url: string }> {
  const start = await startMediaUpload({ bucket, folder, contentType: file.type, size: file.size });
  if (!start.ok) throw new Error(start.error);
  const { ticket, url } = start.data;
  if (ticket.mode === "signed") {
    await putToSignedUrl(ticket.signedUrl, file);
    return { path: ticket.path, url: url ?? "" };
  }
  const data = new FormData();
  data.set("bucket", bucket);
  data.set("folder", folder);
  data.set("file", file);
  const res = await uploadMediaDirect(data);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

/** Natural size of an image file, for width/height (prevents layout shift on the shop). */
export function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
