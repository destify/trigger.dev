import { Client } from 'minio';

// MinIO client configuration
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'csv-uploads';

// Initialize bucket if it doesn't exist
export async function ensureBucketExists() {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

// Generate a presigned URL for file access
export async function getPresignedUrl(objectName: string, expires: number = 24 * 60 * 60) {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, objectName, expires);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

// Upload file to MinIO
export async function uploadFile(objectName: string, buffer: Buffer, size: number, metaData?: Record<string, string>) {
  try {
    await ensureBucketExists();
    const result = await minioClient.putObject(BUCKET_NAME, objectName, buffer, size, metaData);
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Generate file URL (for public buckets or with presigned URLs)
export function getFileUrl(objectName: string): string {
  if (process.env.MINIO_USE_SSL === 'true') {
    return `https://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT || '9000'}/${BUCKET_NAME}/${objectName}`;
  } else {
    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT || '9000'}/${BUCKET_NAME}/${objectName}`;
  }
}