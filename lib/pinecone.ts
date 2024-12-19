import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone"
import { OpenAIApi, Configuration } from 'openai-edge'
import md5 from 'md5'
import { ExtractedData } from '@/types/extractedData';
import { NextResponse } from "next/server";
import path from "path";
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { promises as fs } from "fs";
import { type Document } from "@/types/document";
import { v4 as uuidv4 } from "uuid";

// interface Vector {
//     id: string,
//     values: number[],
//     metadata: {
//         text: string,
//         pageNumber: string
//     }
// };

// Crea un cliente de Pinecone
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string || "",
})

// Crea un cliente de OpenAI
const openaiClient = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY || "",
}))

// export async function getEmbeddings(text: string) {
//     try {
//         const response = await openaiClient.createEmbedding({
//             model: "text-embedding-ada-002",
//             input: text.replace(/\n/g, " ")
//         })
//         const result = await response.json();
//         return result.data[0].embedding as number[];
//     } catch (err) {
//         console.error(err);
//         throw new Error("Error al obtener los embeddings");
//     }
// }


// export async function embedDocuments(doc: ExtractedData) {
//     //Vectorizar los documentos
//     try {
//         const embeddings = await getEmbeddings(doc.Alumno.value);
//         const hash = md5(doc.Alumno.value);

//         return {
//             id: hash,
//             values: embeddings,
//             metadata: {
//                 text: doc.Alumno.value,
//                 pageNumber: doc.Alumno.value,
//             }
//         } as PineconeRecord;
//     } catch (err) {
//         console.error(err);
//         throw new Error("Error al vectorizar los documentos");
//     }
// }

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

export async function initiateBootrstrapping(targetIndex: string) {
    const baseURL = process.env.PRODUCTION_URL || "http://localhost:3000";

    const response = await fetch(`${baseURL}/api/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetIndex })
    });

    if (!response.ok) {
        throw new Error("Error al iniciar el proceso de bootrstrapping");
    }
}

export const handleBootrstrapping = async (targetIndex: string) => {
    try {
        await createIndexIfNecessary(targetIndex);
        const hasVectors = await pineconeIndexHasVectors(targetIndex);

        if (hasVectors) {
            return NextResponse.json({
                message: "El índice ya tiene vectores"
            }, { status: 200 });
        }

        console.log('Cargando documentos y metadatos...');

        const docPath = path.join(process.cwd(), "/tmp");
        const loader = new DirectoryLoader(docPath, {
            '.pdf': (filePath: string) => new PDFLoader(filePath),
        });

        const documents = await loader.load();

        if (documents.length === 0) {
            console.warn("No se encontraron documentos para cargar");
            return NextResponse.json({
                message: "No se encontraron documentos para cargar"
            }, { status: 404 });
        }


        const metadata = await readMetadata();

        const validDocuments = documents.filter((doc) => isValidDocument(doc.pageContent));

        validDocuments.forEach((doc) => {
            const fileMetadata = metadata.find((meta) => meta.NombreArchivo === path.basename(doc.metadata.source));
            if (fileMetadata) {
                doc.metadata = {
                    ...doc.metadata,
                    ...fileMetadata,
                    pageContent: doc.pageContent
                }
            }
        })

        console.log('Documentos válidos:', validDocuments.length);

        // Dividir los documentos en pequeños chunks o fragmentos
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splits = await splitter.splitDocuments(validDocuments);

        console.log('Fragmentos:', splits.length);

        // Procesar en lotes
        const BATCH_SIZE = 5;

        for (let i = 0; i < splits.length; i += BATCH_SIZE) {
            const batch = splits.slice(i, i + BATCH_SIZE);
            console.log(`Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(splits.length / BATCH_SIZE)}`);

            // Filtrar y preparar lote
            const validBatch = batch.filter((split) => isValidDocument(split.pageContent));
            if (validBatch.length === 0) {
                console.warn("Omitiendo lote - Lote no válido");
                continue;
            }

            const castedBatch: Document[] = validBatch.map((split) => ({
                pageContent: split.pageContent.trim(),
                metadata: {
                    ...flattenMetadata(split.metadata as Document["metadata"]),
                    id: uuidv4(),
                    pageContent: split.pageContent.trim(),
                }
            }));

            try {
                // Generate embeddings
                const voyageEmbeddings = new VoyageEmbeddings({
                    apiKey: process.env.VOYAGE_API_KEY,
                    inputType: "document",
                    modelName: "voyage-law-2",
                });

                const pageContents = castedBatch.map((split) => split.pageContent);
                console.log(`Generating embeddings for ${pageContents.length} chunks`);

                const embeddings = await voyageEmbeddings.embedDocuments(pageContents);

                if (!embeddings || embeddings.length !== pageContents.length) {
                    console.error("Invalid embeddings response", {
                        expected: pageContents.length,
                        received: embeddings?.length,
                    });
                    continue;
                }

                // Create vectors
                const vectors = castedBatch.map((split, index) => ({
                    id: split.metadata.Id!,
                    values: embeddings[index],
                    metadata: split.metadata,
                }));

                // Upsert to Pinecone
                const pc = new Pinecone({
                    apiKey: process.env.PINECONE_API_KEY!,
                });

                const index = pc.Index(targetIndex);
                await batchUpserts(index, vectors, 2);

                // Add delay between batches
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(
                    `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
                    {
                        error: error instanceof Error ? error.message : "Unknown error",
                        batchSize: castedBatch.length,
                    }
                );
                continue;
            }
        }

        console.log("Bootstrap procedure completed successfully.");
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Error during bootstrap procedure:", {
            message: error.message,
            cause: error.cause?.message,
            stack: error.stack,
        });

        if (error.code === "UND_ERR_CONNECT_TIMEOUT") {
            return NextResponse.json(
                { error: "Operation timed out - please try again" },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: "Bootstrap procedure failed" },
            { status: 500 }
        );
    }
}

const isValidDocument = (content: string): boolean => {
    if (!content || typeof content != "string") return false;
    const trimmed = content.trim();
    return trimmed.length > 0 && trimmed.length < 8192;
}

export async function createIndexIfNecessary(indexName: string) {
    await pineconeClient.createIndex(
        {
            name: indexName,
            dimension: 1024,
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