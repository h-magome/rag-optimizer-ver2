import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';

export async function GET() {
    try {
        const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

        const blobSvc = BlobServiceClient.fromConnectionString(connStr);
        const container = blobSvc.getContainerClient(containerName);

        const files = [];
        for await (const blob of container.listBlobsFlat()) {
            files.push({
                name: blob.name,
                size: blob.properties.contentLength,
                lastModified: blob.properties.lastModified,
                url: `${container.url}/${blob.name}`,
                contentType: blob.properties.contentType
            });
        }

        // 最新のものから順に並べる
        files.sort((a, b) => new Date(b.lastModified!).getTime() - new Date(a.lastModified!).getTime());

        return NextResponse.json({ files });
    } catch (error: unknown) {
        console.error('Files list error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 