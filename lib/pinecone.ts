'use server';
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone"
import { OpenAIApi, Configuration } from 'openai-edge'
import md5 from 'md5'
import { NextResponse } from "next/server";
import path from "path";
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { UnstructuredLoader } from "@langchain/community/document_loaders/fs/unstructured";
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { promises as fs } from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { type Document } from "@/types/document";
import { v4 as uuidv4 } from 'uuid';
import {
    Document,
    RecursiveCharacterTextSplitter,
  } from "@pinecone-database/doc-splitter";

// interface Vector {
//     id: string,
//     values: number[],
//     metadata: {
//         text: string,
//         pageNumber: string
//     }
// };

type PDFPage = {
    pageContent: string;
    metadata: {
      page_number: number;
    };
  };

// Crea un cliente de Pinecone
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string || "",
})

const getPineconeClient = () => {
    return new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
};

// Crea un cliente de OpenAI
const openaiClient = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY || "",
}))

export async function loadToPinecone(fileName: string, content: string) {

    const docPath = path.join(process.cwd(), "/tmp/", fileName);
    
    const loader = new UnstructuredLoader(docPath, {
        apiKey: process.env.UNSTRUCTURED_API_KEY,
        strategy: "hi_res",
        ocrLanguages: ["spa"],
    });

    const pages = (await loader.load()) as PDFPage[];

    const _pages = splitTextIntoChunks(content)

    const _docs = _pages.map((chunk, index) => ({
        pageContent: chunk,
        metadata: {
            page_number: index + 1
        }
    })) as PDFPage[];


    //Elimino el documento de la carpeta temporal
    await fs.unlink(docPath);

    // Split documents
    const documents = await Promise.all(_docs.map(prepareDocument));

    // Vectorize documents
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    // Upsert to Pinecone
    const client = await getPineconeClient();
    const pineconeIndex = await client.index(process.env.PINECONE_INDEX || "documentos-ucsg");
    const namespace = pineconeIndex.namespace(convertToAscii(fileName));

    await namespace.upsert(vectors);

    return documents[0];
}

function convertToAscii(inputString: string) {
    // remove non ascii characters
    const asciiString = inputString.replace(/[^\x00-\x7F]+/g, "");
    return asciiString;
}

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n{2,}/g, "\n");
    // split the docs
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
      new Document({
        pageContent,
        metadata: {
          pageNumber: metadata.page_number,
          text: pageContent,
        },
      }),
    ]);
    return docs;
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const encoder = new TextEncoder();
    let currentBytes = 0;
    let result = "";
    let maxBytes = bytes;
  
    for (const char of str) {
      const encoded = encoder.encode(char);
      if (currentBytes + encoded.length > maxBytes) break;
  
      currentBytes += encoded.length;
      result += char;
    }
  
    return result;
};

function splitTextIntoChunks(text: string, maxChunkSize: number = 1000) {
    const sentences = text.split(/[.!?]\s+/);
    const chunks = [];
    let currentChunk = '';
  
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
  
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

async function embedDocument(doc: Document) {
    try {
      const embeddings = await getEmbeddings(doc.pageContent);
      const hash = md5(doc.pageContent);
      const textResult = await doc.metadata.text;

      return {
        id: hash,
        values: embeddings,
        metadata: {
          text: textResult,
          pageNumber: doc.metadata.pageNumber,
        },
      } as PineconeRecord;
    } catch (error) {
      console.log("error embedding document", error);
      throw error;
    }
  }

export async function getEmbeddings(text: string) {
    try {
        const response = await openaiClient.createEmbedding({
            model: "text-embedding-ada-002",
            input: text.replace(/\n/g, " "),
        })
        const result = await response.json();
        return result.data[0].embedding as number[];
    } catch (err) {
        console.error(err);
        throw new Error("Error al obtener los embeddings");
    }
}

// export async function loadIntoPinecone(documents: ExtractedData) {

//     //Vectorizar los documentos
//     const vectors = await Promise.all(documents)

//     //Subir los documentos a Pinecone
//     const client = await pineconeClient.index('documentos-ucsg');
//     const namespace = documents[0].Alumno.value //nombre del documento;
//     await client.namespace(namespace).upsert([...vectors]);
//     console.log("Subiendo documentos a Pinecone...");

//     return documents;
// }

// Prepare metadata for upsert to Pinecone - Langchain's PDF loader adds some
// fields that we want to remove before upserting to Pinecone, because Pinecone
// requires that metadata is a string, number or array (not an object)
const flattenMetadata = (metadata: any): Document["metadata"] => {
    const flatMetadata = { ...metadata };
    if (flatMetadata.pdf) {
        if (flatMetadata.pdf.pageCount) {
            flatMetadata.totalPages = flatMetadata.pdf.pageCount;
        }
        delete flatMetadata.pdf;
    }
    if (flatMetadata.loc) {
        delete flatMetadata.loc;
    }
    return flatMetadata;
};

// Function to batch upserts
const batchUpserts = async (
    index: any,
    vectors: any[],
    batchSize: number = 50
) => {
    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        console.log(`Upserting batch ${i + 1} of ${batch.length} vectors...`);
        await index.upsert(batch);
    }
};

export async function initiateBootrstrapping(targetIndex: string, filename: string) {
    const baseURL = process.env.PRODUCTION_URL || "http://localhost:3000";

    const response = await fetch(`${baseURL}/api/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetIndex, filename })
    });

    if (!response.ok) {
        throw new Error("Error al iniciar el proceso de bootrstrapping");
    }
}

// export const handleBootrstrapping = async (targetIndex: string, filename: string) => {
//     try {
//         await createIndexIfNecessary(targetIndex);
//         const hasVectors = await pineconeIndexHasVectors(targetIndex);

//         if (hasVectors) {
//             return NextResponse.json({
//                 message: "El índice ya tiene vectores"
//             }, { status: 200 });
//         }

//         console.log('Cargando documentos y metadatos...');

//         const docPath = path.join(process.cwd(), "/tmp/", filename);
        
//         // const loader = new DirectoryLoader(docPath, {
//         //     '.pdf': (filePath: string) => new PDFLoader(filePath),
//         // });

//         const loader = new UnstructuredLoader(docPath, {
//             apiKey: process.env.UNSTRUCTURED_API_KEY,
//             strategy: "hi_res",
//             ocrLanguages: ["spa"], 
//         });

//         const documents = await loader.load();

//         if (documents.length === 0) {
//             console.warn("No se encontraron documentos para cargar");
//             return NextResponse.json({
//                 message: "No se encontraron documentos para cargar"
//             }, { status: 404 });
//         }

//         //Elimino el documento de la carpeta temporal
//         await fs.unlink(docPath);

//         // const metadata = await readMetadata();

//         // const validDocuments = documents.filter((doc) => isValidDocument(doc.pageContent));

//         // validDocuments.forEach((doc) => {
//         //     const fileMetadata = metadata.find((meta) => meta.NombreArchivo === path.basename(doc.metadata.source));
//         //     if (fileMetadata) {
//         //         doc.metadata = {
//         //             ...doc.metadata,
//         //             ...fileMetadata,
//         //             pageContent: doc.pageContent
//         //         }
//         //     }
//         // })

//         // console.log('Documentos válidos:', validDocuments.length);

//         // Dividir los documentos en pequeños chunks o fragmentos
//         const splitter = new RecursiveCharacterTextSplitter({
//             chunkSize: 1000,
//             chunkOverlap: 200,
//         });

//         const splits = await splitter.splitDocuments(documents);

//         console.log('Fragmentos:', splits.length);

//         // Procesar en lotes
//         const BATCH_SIZE = 5;

//         for (let i = 0; i < splits.length; i += BATCH_SIZE) {
//             const batch = splits.slice(i, i + BATCH_SIZE);
//             console.log(`Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(splits.length / BATCH_SIZE)}`);

//             // Filtrar y preparar lote
//             const validBatch = batch.filter((split) => isValidDocument(split.pageContent));
//             if (validBatch.length === 0) {
//                 console.warn("Omitiendo lote - Lote no válido");
//                 continue;
//             }

//             const castedBatch: Document[] = validBatch.map((split) => ({
//                 pageContent: split.pageContent.trim(),
//                 metadata: {
//                     ...flattenMetadata(split.metadata as Document["metadata"]),
//                     id: uuidv4(),
//                     pageContent: split.pageContent.trim(),
//                 }
//             }));

//             try {
//                 // Generate embeddings
//                 // const voyageEmbeddings = new VoyageEmbeddings({
//                 //     apiKey: process.env.VOYAGE_API_KEY,
//                 //     inputType: "document",
//                 //     modelName: "voyage-law-2",
//                 // });

//                 const pageContents = castedBatch.map((split) => split.pageContent);
//                 console.log(`Generating embeddings for ${pageContents.length} chunks`);

//                 //const embeddings = await getEmbeddings(pageContents);

//                 if (!embeddings || embeddings.length !== pageContents.length) {
//                     console.error("Invalid embeddings response", {
//                         expected: pageContents.length,
//                         received: embeddings?.length,
//                     });
//                     continue;
//                 }

//                 // Create vectors
//                 const vectors = castedBatch.map((split, index) => ({
//                     id: split.metadata.id!,
//                     values: embeddings[index],
//                     metadata: split.metadata,
//                 }));

//                 // Upsert to Pinecone
//                 const pc = new Pinecone({
//                     apiKey: process.env.PINECONE_API_KEY!,
//                 });

//                 const index = pc.Index(targetIndex);
//                 await batchUpserts(index, vectors, 2);

//                 // Add delay between batches
//                 await new Promise((resolve) => setTimeout(resolve, 1000));
//             } catch (error) {
//                 console.error(
//                     `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
//                     {
//                         error: error instanceof Error ? error.message : "Unknown error",
//                         batchSize: castedBatch.length,
//                     }
//                 );
//                 continue;
//             }
//         }

//         console.log("Bootstrap procedure completed successfully.");
//         return NextResponse.json({ success: true }, { status: 200 });

//     } catch (error: any) {
//         console.error("Error during bootstrap procedure:", {
//             message: error.message,
//             cause: error.cause?.message,
//             stack: error.stack,
//         });

//         if (error.code === "UND_ERR_CONNECT_TIMEOUT") {
//             return NextResponse.json(
//                 { error: "Operation timed out - please try again" },
//                 { status: 504 }
//             );
//         }

//         return NextResponse.json(
//             { error: "Bootstrap procedure failed" },
//             { status: 500 }
//         );
//     }
// }

const isValidDocument = (content: string): boolean => {
    if (!content || typeof content != "string") return false;
    const trimmed = content.trim();
    return trimmed.length > 0 && trimmed.length < 8192;
}

export async function createIndexIfNecessary(indexName: string) {
    await pineconeClient.createIndex(
        {
            name: indexName,
            dimension: 1536,
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1',
                }
            },
            waitUntilReady: true,
            suppressConflicts: true,
        }
    )
}

export async function readMetadata(): Promise<Document["metadata"][]> {
    try {
        const filePath = path.resolve(process.cwd(), "/docs/metadata.json");
        const data = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(data);

        return parsed.documents || [];
    } catch (err) {
        console.warn("No se encontró el archivo de metadatos", err);
        return [];
    }
}

export async function pineconeIndexHasVectors(indexName: string) {
    try {
        const targetIndex = await pineconeClient.index(indexName);
        const stats = await targetIndex.describeIndexStats();
        return (stats.totalRecordCount && stats.totalRecordCount > 0) ? true : false;
    }
    catch (err) {
        console.error(err);
        throw new Error("Error al verificar si el índice tiene vectores");
    }
}