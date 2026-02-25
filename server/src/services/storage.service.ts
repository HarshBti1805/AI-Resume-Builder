import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
  } from "@aws-sdk/client-s3";
  
  // ─────────────────────────────────────────────
  // S3 client — works with both AWS S3 and MinIO
  // ─────────────────────────────────────────────
  
  const s3 = new S3Client({
    region: process.env.S3_REGION ?? "ap-south-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    // MinIO requires a custom endpoint + path-style URLs
    ...(process.env.S3_ENDPOINT
      ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
  });
  
  const BUCKET = process.env.S3_BUCKET!;
  
  // ─────────────────────────────────────────────
  // Upload a buffer to S3 and return the public URL
  // ─────────────────────────────────────────────
  
  export const uploadToS3 = async (
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<string> => {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  
    if (process.env.S3_ENDPOINT) {
      // MinIO: http(s)://endpoint/bucket/key
      return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
    }
  
    // AWS S3: https://bucket.s3.region.amazonaws.com/key
    return `https://${BUCKET}.s3.${process.env.S3_REGION ?? "ap-south-1"}.amazonaws.com/${key}`;
  };
  
  // ─────────────────────────────────────────────
  // Delete an object from S3 by key
  // ─────────────────────────────────────────────
  
  export const deleteFromS3 = async (key: string): Promise<void> => {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  };