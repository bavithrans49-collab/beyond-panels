const SUPABASE_URL = `https://${process.env.SUPABASE_PROJECT_REF!}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "beyond-panels";

const STORAGE_URL = `${SUPABASE_URL}/storage/v1`;
const PUBLIC_URL = `${STORAGE_URL}/object/public/${BUCKET}`;

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${STORAGE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase Storage error ${res.status}: ${text}`);
  }
  return res;
}

export async function uploadToR2(comicId: string, filename: string, buffer: Buffer, contentType: string) {
  const key = `${comicId}/${filename}`;
  await supabaseFetch(`/object/${BUCKET}/${key}`, {
    method: "POST",
    body: new Uint8Array(buffer),
    headers: { "Content-Type": contentType },
  });
  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(comicId: string, filename: string) {
  const key = `${comicId}/${filename}`;
  await supabaseFetch(`/object/${BUCKET}`, {
    method: "DELETE",
    body: JSON.stringify({ prefixes: [key] }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteKeysFromR2(keys: string[]) {
  if (keys.length === 0) return;
  await supabaseFetch(`/object/${BUCKET}`, {
    method: "DELETE",
    body: JSON.stringify({ prefixes: keys }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getPublicUrl(comicId: string, filename: string) {
  return `${PUBLIC_URL}/${comicId}/${filename}`;
}
