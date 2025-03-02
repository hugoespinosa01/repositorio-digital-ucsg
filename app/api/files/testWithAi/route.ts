import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import DocumentIntelligence, { AnalyzeOperationOutput, getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { NextResponse } from 'next/server';

// Configura las credenciales y endpoints
const documentIntelligenceEndpoint = process.env.FORM_RECOGNIZER_ENDPOINT!;
const documentIntelligenceKey = process.env.FORM_RECOGNIZER_API_KEY!;
const openAIApiKey = process.env.AZURE_OPENAI_API_KEY!;
const openAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;  // Ejemplo: https://<your-resource-name>.openai.azure.com/
const openAIModel = process.env.AZURE_OPENAI_MODEL!;         // Ejemplo: gpt-3.5-turbo

// Función para extraer Markdown del PDF usando el modelo prebuilt-layout
async function extractMarkdownFromPDF(base64PDF: Buffer): Promise<string> {
    const client = DocumentIntelligence(documentIntelligenceEndpoint, {
        key: documentIntelligenceKey,
    });

    // Iniciar análisis con prebuilt-layout solicitando formato Markdown
    const initialResponse = await client
        .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
        .post({
            contentType: "application/json",
            body: {
                base64Source: base64PDF.toString("base64"),
            },
            queryParameters: {
                outputContentFormat: "markdown" // Solicitar formato Markdown
            },
        });

    if (isUnexpected(initialResponse)) {
        throw new Error(`Error al iniciar el análisis: ${initialResponse.body.error.message}`);
    }

    const poller = getLongRunningPoller(client, initialResponse);

    const analyzeResult = ((await poller.pollUntilDone()).body as AnalyzeOperationOutput)
        .analyzeResult;

    const documents = analyzeResult?.documents;

    const document = documents && documents[0];
    if (!document) {
        throw new Error("Expected at least one document in the result.");
    }

    console.log(
        "Extracted document:",
        document.docType,
        `(confidence: ${document.confidence || "<undefined>"})`,
    );
    console.log("Fields:", document.fields);

    return analyzeResult.content ?? '';
}

// Función de preprocesamiento: limpia el texto markdown
function preprocessMarkdown(markdown: string): string {
    // Eliminar caracteres de control y no imprimibles
    let cleaned = markdown.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Normalizar saltos de línea
    cleaned = cleaned.replace(/\r\n/g, '\n');

    // Eliminar múltiples saltos de línea consecutivos
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Eliminar caracteres especiales que pueden causar problemas en el procesamiento
    cleaned = cleaned.replace(/[^\x20-\x7E\n\t]/g, ' ');

    return cleaned.trim();
}

function createChunks(text: string, maxChunkSize: number = 4000): string[] {
    // Dividir por párrafos primero
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // Si agregar el párrafo excedería el tamaño máximo
        if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
            // Si el párrafo por sí solo excede el tamaño máximo, subdividirlo
            if (paragraph.length > maxChunkSize) {
                // Si el chunk actual no está vacío, guardarlo
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }

                // Dividir el párrafo grande en chunks más pequeños
                for (let i = 0; i < paragraph.length; i += maxChunkSize) {
                    const subChunk = paragraph.substring(i, i + maxChunkSize);
                    chunks.push(subChunk);
                }
            } else {
                // Guardar el chunk actual y empezar uno nuevo con este párrafo
                chunks.push(currentChunk);
                currentChunk = paragraph;
            }
        } else {
            // Agregar el párrafo al chunk actual
            if (currentChunk.length > 0) {
                currentChunk += '\n\n';
            }
            currentChunk += paragraph;
        }
    }

    // Agregar el último chunk si no está vacío
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}
// Función para invocar Azure OpenAI y estructurar los datos según un esquema JSON
async function processDataWithOpenAI(chunks: string[], jsonSchema: object): Promise<any[]> {
    // Define el prompt inicial combinando el esquema y la instrucción para estructurar la data
    const promptBase = `Eres un experto en procesamiento de documentos. A continuación se te entrega un texto en formato Markdown extraído de un PDF. Preprocesa y organiza la información en un array de objetos siguiendo el siguiente esquema JSON: ${JSON.stringify(jsonSchema)}.\n\nTexto:\n`;

    // Combina los chunks (podrías enviar cada chunk por separado si la longitud es mayor al límite)
    const fullText = chunks.join('\n');
    const prompt = promptBase + fullText;

    // Llamada a Azure OpenAI Service (esta es una solicitud REST básica; asegúrate de tener configurado el endpoint)
    const response = await axios.post(
        `${openAIEndpoint}/openai/deployments/${openAIModel}/completions?api-version=2023-03-15-preview`,
        {
            prompt: prompt,
            max_tokens: 1024,
            temperature: 0.2,
            // Puedes incluir otros parámetros necesarios según la configuración de tu modelo
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'api-key': openAIApiKey
            }
        }
    );

    // Se espera que la respuesta contenga el JSON estructurado; se parsea y se retorna
    try {
        const structuredData = JSON.parse(response.data.choices[0].text);
        return structuredData;
    } catch (error) {
        throw new Error('Error al parsear la respuesta de OpenAI: ' + error);
    }
}

// API Route para manejar la conversión y análisis
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { pdfData } = req.body;

        if (!pdfData) {
            return res.status(400).json({ error: 'Falta el pdfData en el body' });
        }

        // Convierte el base64 a un buffer
        const pdfBuffer = Buffer.from(pdfData, 'base64');

        // Extrae el Markdown usando Azure Document Intelligence
        const rawMarkdown = await extractMarkdownFromPDF(pdfBuffer);

        // Limpia el Markdown
        const cleanedMarkdown = preprocessMarkdown(rawMarkdown);

        // Crea chunks del contenido
        const chunks = createChunks(cleanedMarkdown);

        // Define el esquema JSON
        const jsonSchema = {
            properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                page: { type: 'number' },
            },
            required: ['title', 'content', 'page'],
        };

        // Procesa datos con Azure OpenAI
        const structuredOutput = await processDataWithOpenAI(chunks, jsonSchema);

        res.status(200).json({ data: structuredOutput });
    } catch (error : any) {
        console.error('Error procesando el documento:', error.message);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}