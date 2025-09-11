import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getPresignedUrl, BUCKET_NAME } from '@/lib/minio';
import { tasks } from '@trigger.dev/sdk/v3';
import type { csvValidator } from '@/trigger/csv';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (4MB limit)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 4MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const objectName = `csv-uploads/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    const etag = await uploadFile(objectName, buffer, file.size, {
      'Content-Type': file.type,
      'Original-Name': file.name,
    });

    // Generate presigned URL for access
    const presignedUrl = await getPresignedUrl(objectName);

    // Create file data object matching the expected schema
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      key: objectName,
      url: presignedUrl,
      appUrl: presignedUrl, // Using the same URL for both
      fileHash: typeof etag === 'string' ? etag : etag.etag || '',
      customId: null,
    };

    // Trigger the CSV processing task
    const handle = await tasks.trigger<typeof csvValidator>(
      'csv-validator',
      fileData
    );

    return NextResponse.json({
      success: true,
      file: fileData,
      serverData: handle,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}