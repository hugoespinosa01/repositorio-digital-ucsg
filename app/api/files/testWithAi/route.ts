import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import DocumentIntelligence, { AnalyzeOperationOutput, getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { NextRequest, NextResponse } from 'next/server';
import { OpenAIApi, Configuration } from 'openai-edge';
import { PDFDocument } from 'pdf-lib';
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";



// Configura las credenciales y endpoints
const documentIntelligenceEndpoint = process.env.FORM_RECOGNIZER_ENDPOINT!;
const documentIntelligenceKey = process.env.FORM_RECOGNIZER_API_KEY!;
const openAIApiKey = process.env.AZURE_OPENAI_API_KEY!;
const openAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;  // Ejemplo: https://<your-resource-name>.openai.azure.com/
const openAIModel = process.env.AZURE_OPENAI_MODEL!;         // Ejemplo: gpt-3.5-turbo

// Crea un cliente de OpenAI
const openaiClient = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY || "",
}))

// Función para extraer Markdown del PDF usando el modelo prebuilt-layout
async function extractMarkdownFromPDF(base64Pdf: string): Promise<string> {
    const client = DocumentIntelligence(documentIntelligenceEndpoint, {
        key: documentIntelligenceKey,
    });

    // Iniciar análisis con prebuilt-layout solicitando formato Markdown
    const initialResponse = await client
        .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
        .post({
            contentType: "application/json",
            body: {
                base64Source: base64Pdf,
            },
            queryParameters: {
                outputContentFormat: "markdown", // Solicitar formato Markdown
                locale: "es-EC", // Establecer el idioma del documento
            },
        });

    if (isUnexpected(initialResponse)) {
        throw new Error(`Error al iniciar el análisis: ${initialResponse.body.error.message}`);
    }

    const poller = getLongRunningPoller(client, initialResponse);

    const analyzeResult = ((await poller.pollUntilDone()).body as AnalyzeOperationOutput)
        .analyzeResult;

    const content = analyzeResult?.content;

    if (!content) {
        throw new Error("Expected at least one document in the result.");
    }

    return analyzeResult.content ?? '';
}

async function toBase64(file: ArrayBuffer): Promise<string> {
    const buffer = Buffer.from(file);
    // Convertimos Buffer a Base64
    const base64String = buffer.toString('base64');
    return base64String
}

function preprocessMarkdown(markdown: string): string {
    // Eliminar solo caracteres de control problemáticos pero mantener tabulaciones (\t) y saltos de línea (\n)
    let cleaned = markdown.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // Normalizar saltos de línea
    cleaned = cleaned.replace(/\r\n/g, '\n');

    // Eliminar múltiples saltos de línea consecutivos, pero mantener hasta dos
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // No eliminar caracteres acentuados o especiales del español
    // Se mantienen intactos: á, é, í, ó, ú, ü, ñ, Á, É, Í, Ó, Ú, Ü, Ñ, ¿, ¡

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
// // Función para invocar Azure OpenAI y estructurar los datos según un esquema JSON
// async function processDataWithOpenAI(chunks: string[], jsonSchema: object): Promise<any[]> {

//     let allResults: any[] = [];

//     // Define el prompt inicial combinando el esquema y la instrucción para estructurar la data
//     const promptBase = `Eres un experto en procesamiento de documentos.
//         A continuación se te entrega un texto en formato Markdown extraído de un PDF.
//         Preprocesa y organiza la información en un array de objetos siguiendo el siguiente esquema 

//         Reglas:
//         1. Si ves "A" o "+" en matrícula, usar NoMatricula = 1
//         2. Convertir calificaciones de formato "XX/30" a decimal (multiplicar por 10/30)
//         3. Extraer el periodo del texto cuando esté disponible
//         4. Ignorar filas que no sean materias (encabezados, notas, etc)
//         5. Devolver SOLO el array JSON, sin explicaciones

//         JSON: ${JSON.stringify(jsonSchema)}.
//         Texto extraído: \n`;

//     // Prompt reducido para los chunks siguientes
//     const reducedPromptBase = `Continúa procesando el siguiente fragmento extraído en Markdown:`;

//     for (let i = 0; i < chunks.length; i++) {
//         const currentChunk = chunks[i];
//         // Si es el primer chunk, usa el prompt completo; para los demás, el reducido.
//         const prompt = i === 0 ? promptBase + currentChunk : reducedPromptBase + currentChunk;

//         // Llamada a Azure OpenAI Service (esta es una solicitud REST básica; asegúrate de tener configurado el endpoint)
//         const response = await openaiClient.createCompletion({
//             model: "gpt-4o-mini",
//             prompt: prompt,
//             max_tokens: 2048,
//             temperature: 0.3
//         })

//         const res = await response.json();
//         let resultText = res.choices[0].text.trim();

//         try {
//             // Intenta extraer el JSON estructurado
//             const jsonMatch = resultText.match(/$[\s\S]*$/);
//             const jsonStr = jsonMatch ? jsonMatch[0] : resultText;
//             const chunkResults = JSON.parse(jsonStr);
//             allResults = allResults.concat(chunkResults);
//             return allResults;
//         } catch (error) {
//             console.error('Error al parsear la respuesta:', resultText);
//             console.error(error);
//             throw new Error('Error al parsear la respuesta');
//         }
//     }

// }


async function processDataWithOpenAI(chunks: string[], jsonSchema: object): Promise<any[]> {
    let allResults: any[] = [];

    // Define el prompt inicial combinando el esquema y la instrucción para estructurar la data
    const promptBase = `Eres un experto en procesamiento de documentos.
        A continuación se te entrega un texto en formato Markdown extraído de un PDF.
        Preprocesa y organiza la información en un array de objetos siguiendo el siguiente esquema

        Reglas:
        1. Si ves "A" o "+" en matrícula, usar NoMatricula = 1
        2. Convertir calificaciones de formato "XX/30" a decimal (multiplicar por 10/30)
        3. Extraer el periodo del texto cuando esté disponible
        4. Ignorar filas que no sean materias (encabezados, notas, etc)
        5. Devolver SOLO el array JSON, sin explicaciones

        JSON: ${JSON.stringify(jsonSchema)}.
        Texto extraído: \n`;

    // Prompt reducido para los chunks siguientes
    const reducedPromptBase = `Continúa procesando el siguiente fragmento extraído en Markdown siguiendo las mismas reglas anteriores:
        1. Si ves "A" o "+" en matrícula, usar NoMatricula = 1
        2. Convertir calificaciones de formato "XX/30" a decimal (multiplicar por 10/30)
        3. Extraer el periodo del texto cuando esté disponible
        4. Ignorar filas que no sean materias
        
        Fragmento a procesar:\n`;

    for (let i = 0; i < chunks.length; i++) {
        const currentChunk = chunks[i];
        // Si es el primer chunk, usa el prompt completo; para los demás, el reducido.
        const prompt = i === 0 ? promptBase + currentChunk : reducedPromptBase + currentChunk;

        try {
            // Llamada a Azure OpenAI Service (esta es una solicitud REST básica; asegúrate de tener configurado el endpoint)
            const response = await openaiClient.createChatCompletion({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: 2048,
                temperature: 0.3,
            })

            const res = await response.json();
            let resultText = res.choices[0].message.content.trim();

            // Intenta extraer el JSON estructurado
            // Modificado el regex para capturar mejor el JSON
            const jsonRegex = /$[\s\S]*?$/;
            resultText = resultText.replaceAll('```json', '');
            const jsonMatch = resultText.match(jsonRegex);
            if (!jsonMatch) {
                console.warn('No se encontró un JSON válido en la respuesta:', resultText);
                continue; // Salta al siguiente chunk si no hay JSON válido
            }

            const chunkResults = JSON.parse(jsonMatch[0]);

            // Verifica que chunkResults sea un array
            if (Array.isArray(chunkResults)) {
                allResults = allResults.concat(chunkResults);
            } else {
                console.warn('El resultado no es un array:', chunkResults);
            }

        } catch (error) {
            console.error('Error procesando chunk ' + i + ':', error);
            // Continúa con el siguiente chunk en lugar de fallar completamente
            continue;
        }
    }

    // Eliminar posibles duplicados basados en combinación de Materia y Periodo
    const uniqueResults = allResults.filter((item, index, self) =>
        index === self.findIndex((t) =>
            t.Materia === item.Materia &&
            t.Periodo === item.Periodo
        )
    );

    return uniqueResults;
}

// API Route para manejar la conversión y análisis
export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const formData = await req.formData();

        if (!formData) {
            return NextResponse.json({ error: 'No form data' }, { status: 400 });
        }

        const file = formData.get('file');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const fileBuffer = await file.arrayBuffer();

        // Cargar el PDF
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const pageCount = pdfDoc.getPageCount();

        // Clasificar si es malla curricular
        console.log('Clasificando documento...');
        const resultClassification = await classifyMallaCurricular(fileBuffer);

        if (!resultClassification) {
            throw new Error('Error classifying malla curricular');
        }

        let pdfToAnalyze;

        // Validar clasificación
        if (resultClassification == 'malla-curricular') {
            console.log('Documento clasificado como malla curricular, excluyendo primera página...');

            // Crear nuevo PDF sin la primera página
            const newPdfDoc = await PDFDocument.create();
            const pagesToCopy = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const newPdfBytes = await newPdfDoc.save();
            pdfToAnalyze = new Uint8Array(newPdfBytes).buffer;
        } else {
            console.log('Documento no es malla curricular, procesando todas las páginas...');
            // Usar el documento original completo
            pdfToAnalyze = file;
        }

        const blobFile = pdfToAnalyze as ArrayBuffer;

        const pdfData = await toBase64(blobFile) as string;

        // Extrae el Markdown usando Azure Document Intelligence
        const rawMarkdown = await extractMarkdownFromPDF(pdfData);

        // Limpia el Markdown
        const cleanedMarkdown = preprocessMarkdown(rawMarkdown);

        // Crea chunks del contenido
        const chunks = createChunks(cleanedMarkdown);

        // Define el esquema JSON
        const jsonSchema = {
            Id: "number",
            Ciclo: "string",
            Materia: "string",
            Periodo: "string",
            Calificacion: "number",
            NoMatricula: "1 | 2 | 3",
            IdDocumentoKardex: 0,
            Estado: 1,
            isNewRow: "boolean",
        };

        // Procesa datos con Azure OpenAI
        const structuredOutput = await processDataWithOpenAI(chunks, jsonSchema);

        return NextResponse.json({ data: structuredOutput }, { status: 200 });
    } catch (error: any) {
        console.error('Error procesando el documento:', error.message);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

const classifyMallaCurricular = async (file: ArrayBuffer): Promise<string | null> => {
    try {
        console.log('Classifying malla...');
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT;
        const apiKey = process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document classification...');

        const poller = await client.beginClassifyDocument('malla-curricular-classifier', file);

        console.log('Waiting for classification to complete...');
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return null;
        }

        console.log('Classification completed successfully', result.documents[0].docType);

        const docType = result.documents[0].docType;

        // Validar explícitamente el tipo de documento
        const validTypes = ['malla-curricular', 'no-malla'];

        if (!validTypes.includes(docType)) {
            return null;
        }

        return docType;
    } catch (err) {
        console.error('Error clasificando los documentos dentro de la funcion classifyMallaCurricular:', err);
        throw err;
    }
}