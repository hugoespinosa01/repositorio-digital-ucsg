import { createWorker } from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(filePath: string): Promise<string[]> {
  const worker = await createWorker('spa');
  // const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(filePath).promise;
  const textPages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    
    // Create canvas and render PDF page
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d')!;
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    
    // Perform OCR on the image
    if (blob) {
      const { data: { text } } = await worker.recognize(blob);
      textPages.push(text);
    } else {
      console.error('Failed to create blob from canvas');
    }
  }

  await worker.terminate();
  return textPages;
}