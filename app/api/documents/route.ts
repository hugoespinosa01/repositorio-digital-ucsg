import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

export async function GET() {

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Check if the container exists
    const containerExists = await containerClient.exists();
    
    if (!containerExists) {
      console.error(`Container '${containerName}' does not exist`);
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const documents = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();
      
      documents.push({
        id: blob.name,
        title: properties.metadata?.title || 'Sin título',
        description: properties.metadata?.description || 'Sin descripción',
        uploadDate: properties.createdOn,
      });
    }

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
  }
}