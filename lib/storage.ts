import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateImageBytes, MAX_IMAGE_BYTES } from "@/lib/image-validation";
import type { ValidatedImageFormat } from "@/lib/image-validation";

export const ASSET_BUCKET = "assets";
export { MAX_IMAGE_BYTES };

function client() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Object storage is not configured.");
  }
  return new S3Client({
    endpoint,
    region: process.env.AWS_REGION || "auto",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function validateImage(file: File): Promise<ValidatedImageFormat & { bytes: Uint8Array }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { ...validateImageBytes(bytes, file.name, file.type), bytes };
}

export async function uploadImage(key: string, file: File, verified?: Awaited<ReturnType<typeof validateImage>>) {
  const image = verified ?? await validateImage(file);
  if (!/^works\/[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\.(jpg|jpeg|png)$/i.test(key) ||
      !key.toLowerCase().endsWith(image.extension)) {
    throw new Error("Invalid image object key.");
  }
  await client().send(new PutObjectCommand({
    Bucket: ASSET_BUCKET,
    Key: key,
    Body: Buffer.from(image.bytes),
    ContentType: image.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
}

export async function deleteImage(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: ASSET_BUCKET, Key: key }));
}

export async function imageUrl(key: string) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: ASSET_BUCKET, Key: key }), { expiresIn: 900 });
}
