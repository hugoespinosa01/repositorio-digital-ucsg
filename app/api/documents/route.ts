import { NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = 'documents';

export async function GET() {
  if (!accountName || !accountKey) {
    console.error('Azure Storage credentials are not set');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

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