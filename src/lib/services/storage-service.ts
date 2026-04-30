import "server-only";
import fs from "fs/promises";
import path from "path";

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export interface StorageResult {
  storagePath: string;
  url: string;
}

export async function storeFile(
  key: string,
  buffer: Buffer,
  contentType?: string
): Promise<StorageResult> {
  if (STORAGE_PROVIDER === "s3") {
    return storeS3(key, buffer, contentType);
  }

  return storeLocal(key, buffer);
}

async function storeLocal(key: string, buffer: Buffer): Promise<StorageResult> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, key);
  await fs.writeFile(filePath, buffer);
  return { storagePath: filePath, url: `/uploads/${key}` };
}

async function storeS3(key: string, buffer: Buffer, contentType?: string): Promise<StorageResult> {
  const {
    S3Client,
    PutObjectCommand,
  } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
  });

  const bucket = process.env.S3_BUCKET || "socialsciencr";
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const endpoint = process.env.S3_ENDPOINT || `https://${bucket}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com`;
  return {
    storagePath: `s3://${bucket}/${key}`,
    url: `${endpoint}/${bucket}/${key}`,
  };
}

export async function getFileBuffer(storagePath: string): Promise<Buffer> {
  if (storagePath.startsWith("s3://")) {
    return getS3FileBuffer(storagePath);
  }

  return fs.readFile(storagePath);
}

async function getS3FileBuffer(storagePath: string): Promise<Buffer> {
  const {
    S3Client,
    GetObjectCommand,
  } = await import("@aws-sdk/client-s3");

  const bucket = process.env.S3_BUCKET || "socialsciencr";
  const key = storagePath.replace(`s3://${bucket}/`, "");

  const client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
  });

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  if (!response.Body) throw new Error("Empty S3 response");
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteFile(storagePath: string): Promise<void> {
  if (storagePath.startsWith("s3://")) {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const bucket = process.env.S3_BUCKET || "socialsciencr";
    const key = storagePath.replace(`s3://${bucket}/`, "");
    const client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
    });
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }

  try {
    await fs.unlink(storagePath);
  } catch {
    // File may already be deleted
  }
}
