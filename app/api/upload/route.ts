import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import * as pdfParse from 'pdf-parse';
import * as Tesseract from 'tesseract.js';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'documents';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Procesar el PDF
    const pdfData = await file.arrayBuffer();
    const pdfContent = await pdfParse(pdfData);

    // Extraer texto con OCR si es necesario
    let extractedText = pdfContent.text;
    if (extractedText.trim().length === 0) {
      const { data: { text } } = await Tesseract.recognize(pdfData);
      extractedText = text;
    }

    // Aquí iría la lógica para clasificar el documento y extraer metadatos con IA
    // Por ahora, usaremos los metadatos proporcionados por el usuario

    // Subir a Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}.pdf`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(pdfData, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
      metadata: {
        title: metadata.title,
        description: metadata.description,
        extractedText: extractedText,
      },
    });

    // Guardar en la base de datos SQL Server
    // Aquí iría la lógica para guardar los metadatos en SQL Server

    return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}