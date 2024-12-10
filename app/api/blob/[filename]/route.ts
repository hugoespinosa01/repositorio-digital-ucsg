import { BlobServiceClient } from "@azure/storage-blob";
import { NextRequest, NextResponse } from "next/server";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

interface Params {
    params: { filename: string };
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
    
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const res = await containerClient.getBlockBlobClient(params.filename).downloadToBuffer();

        return new Response(res, {
            headers: {
                'Content-Type': 'application/pdf',
            }
        });
    
    } catch (err) {
        console.error('Error fetching files:', err);
        const errResponse = {
            error: 'Error fetching files',
            status: 500,
            message: err,
        }
        return NextResponse.json(errResponse);
    }

}
