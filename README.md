## Trigger.dev + Next.js Realtime CSV Importer with MinIO

https://github.com/user-attachments/assets/25160343-6663-452c-8a27-819c3fd7b8df

This demo is a full stack example that demonstrates how to use Trigger.dev Realtime to build a CSV Uploader with live progress updates. The frontend is a Next.js app that allows users to upload a CSV file, which is then processed in the background using Trigger.dev tasks. The progress of the task is streamed back to the frontend in real-time using Trigger.dev Realtime.

**🔄 Recently Refactored:** This project has been updated to use MinIO SDK instead of UploadThing for object storage.

- A [Next.js](https://nextjs.org/) app with [Trigger.dev](https://trigger.dev/) for the background tasks.
- [MinIO](https://min.io/) for S3-compatible object storage to handle CSV file uploads
- Trigger.dev [Realtime](https://trigger.dev/launchweek/0/realtime) to stream updates to the frontend.
- Uses [Bun](https://bun.sh/) as the JavaScript runtime and package manager for improved performance.

## MinIO Setup

This project uses MinIO for object storage. You'll need to set up a MinIO server:

### Option 1: Local MinIO with Docker

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

### Option 2: MinIO Cloud

Sign up at [MinIO Cloud](https://min.io/cloud) and get your credentials.

## Getting started

1. After cloning the repo, run `bun install` (or `npm install`) to install the dependencies.
2. Copy the `.env.example` file to `.env.local` and fill in the required environment variables:
   - **MinIO Configuration:** Set up your MinIO endpoint, credentials, and bucket name
   - **Trigger.dev Configuration:** Sign up for a free Trigger.dev account [here](https://cloud.trigger.dev/login) and create a new project.
3. Copy the project ref from the Trigger.dev dashboard and add it to the `trigger.config.ts` file.
4. Run the Next.js server with `bun run dev` (or `npm run dev`).
5. In a separate terminal, run the Trigger.dev dev CLI command with `bun run trigger:dev` (it may ask you to authorize the CLI if you haven't already).

Now you should be able to visit `http://localhost:3000` and see the app running. Upload a CSV file and watch the progress bar update in real-time!

## Relevant code

### MinIO Integration
- **MinIO Configuration:** [src/lib/minio.ts](src/lib/minio.ts) - MinIO client setup and utility functions
- **Upload API:** [src/app/api/upload/route.ts](src/app/api/upload/route.ts) - New API endpoint for file uploads using MinIO
- **CSV Uploader Component:** [src/components/csv-uploader.tsx](src/components/csv-uploader.tsx) - Refactored to use MinIO instead of UploadThing

### Trigger.dev Processing
- **Trigger.dev Task:** [src/trigger/csv.ts](src/trigger/csv.ts) - Downloads CSV from MinIO, parses it, and splits rows into batches
- The parent task `csvValidator` downloads the CSV file using MinIO presigned URLs, parses it, and then splits the rows into multiple batches. It then does a `batch.triggerAndWait` to distribute the work to the `handleCSVRow` task.
- The `handleCSVRow` task "simulates" checking the row for a valid email address and then updates the progress of the parent task using `metadata.parent`. See the [Trigger.dev docs](https://trigger.dev/docs/runs/metadata#parent-and-root-updates) for more information on how to use the `metadata.parent` object.
- The `useRealtimeCSVValidator` hook in the [src/hooks/useRealtimeCSVValidator.ts](src/hooks/useRealtimeCSVValidator.ts) file handles the call to `useRealtimeRun` to get the progress of the parent task.

## Learn More

To learn more about Trigger.dev Realtime, take a look at the following resources:

- [Trigger.dev Documentation](https://trigger.dev/docs) - learn about Trigger.dev and its features.
- [Metadata docs](https://trigger.dev/docs/runs/metadata) - learn about the Run Metadata feature of Trigger.dev.
- [Batch Trigger docs](https://trigger.dev/docs/triggering) - learn about the Batch Trigger feature of Trigger.dev.
- [Realtime docs](https://trigger.dev/docs/realtime) - learn about the Realtime feature of Trigger.dev.
- [React hooks](https://trigger.dev/docs/frontend/react-hooks) - learn about the React hooks provided by Trigger.dev.
