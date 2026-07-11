import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "beyond-panels";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function buildKey(comicId: string, filename: string) {
  return `${comicId}/${filename}`;
}

export async function uploadToR2(comicId: string, filename: string, buffer: Buffer, contentType: string) {
  const key = buildKey(comicId, filename);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return r2PublicUrl(key);
}

export async function deleteFromR2(comicId: string, filename: string) {
  const key = buildKey(comicId, filename);
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export async function deleteKeysFromR2(keys: string[]) {
  if (keys.length === 0) return;
  await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: { Objects: keys.map((k) => ({ Key: k })) },
    })
  );
}

export async function getPresignedUrl(comicId: string, filename: string, expiresIn = 3600) {
  const key = buildKey(comicId, filename);
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export function r2PublicUrl(key: string) {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return `https://${R2_BUCKET_NAME}.r2.dev/${key}`;
}
