'use server';

import { BlobServiceClient } from '@azure/storage-blob';
import { Documento } from '@prisma/client';

interface DocumentLabel {
    label: string;
    value: [{
      page: number;
      text: string;
      boundingBoxes: number[][];
    }];
  }

export async function getContainerSize(containerName: string, folder: string) {
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    let totalSize = 0;

    const options = {
        prefix: `${folder}/`, // Prefijo para filtrar blobs (opcional)
    }

    // Iterar sobre todos los blobs en el contenedor
    for await (const blob of containerClient.listBlobsFlat(options)) {
      totalSize += blob.properties.contentLength || 0;
    }
    
    return totalSize;
}

export async function getBlobJsonData (containerName: string, documento: Documento) {
    // 2. Obtener el JSON original de Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient('formato_computacion_1/' + 'd8c1d6fe-21b1-4ac6-a69e-0a0996053b2e.pdf.labels.json' || '');

    const downloadBlockBlobResponse = await blobClient.download(0);
    
    if (!downloadBlockBlobResponse.errorCode && downloadBlockBlobResponse.readableStreamBody) {
        const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
        if (downloaded) {
          console.log('Downloaded blob content:', downloaded.toString());
        }
        const jsonData: DocumentLabel[] = JSON.parse(downloaded.toString());
        console.log('JSON Data:', jsonData);
        return jsonData;
    } else {
        console.error('Error downloading blob:', downloadBlockBlobResponse.errorCode);
    }

}

// Función auxiliar para convertir stream a string
function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
  
      readableStream.on('data', (data) => {
        const content: Uint8Array = data instanceof Buffer ? new Uint8Array(data) : new Uint8Array(Buffer.from(data));
        chunks.push(content);
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

