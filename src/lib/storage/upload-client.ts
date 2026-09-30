/** Browser side of a signed upload: the same request storage-js makes in uploadToSignedUrl. */
export async function putToSignedUrl(signedUrl: string, file: File) {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  const res = await fetch(signedUrl, { method: "PUT", body, headers: { "x-upsert": "false" } });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}
