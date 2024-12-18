import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone" 
import { OpenAIApi, Configuration} from  'openai-edge'
import md5 from 'md5'
import { ExtractedData } from '@/types/extractedData';
import { NextResponse } from "next/server";
import path from "path";
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { promises } from "fs";

interface Vector {
    id: string,
    values: number[],
    metadata: {
        text: string,
        pageNumber: string
    }
};

// Crea un cliente de Pinecone
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string || "",
})

// Crea un cliente de OpenAI
const openaiClient = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY || "",
}))

export async function getEmbeddings (text : string) {
    try {
        const response = await openaiClient.createEmbedding({
            model: "text-embedding-ada-002",
            input: text.replace(/\n/g, " ")
        })
        const result = await response.json();
        return result.data[0].embedding as number[];
    }catch(err) {
        console.error(err);
        throw new Error("Error al obtener los embeddings");
    }
}


export async function embedDocuments (doc: ExtractedData) {
    //Vectorizar los documentos
    try {
        const embeddings = await getEmbeddings(doc.Alumno.value);
        const hash = md5(doc.Alumno.value);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.Alumno.value,
                pageNumber: doc.Alumno.value,
            }
        } as PineconeRecord;
    } catch (err) {
        console.error(err);
        throw new Error("Error al vectorizar los documentos");
    }
}

export async function loadIntoPinecone (documents: ExtractedData) {
    
    //Vectorizar los documentos
    const vectors = await Promise.all(documents)

    //Subir los documentos a Pinecone
    const client = await pineconeClient.index('documentos-ucsg');
    const namespace = documents[0].Alumno.value //nombre del documento;
    await client.namespace(namespace).upsert([...vectors]);
    console.log("Subiendo documentos a Pinecone...");

    return documents;
}

export async function initiateBootrstrapping (targetIndex: string) {
    const baseURL = process.env.PRODUCTION_URL || "http://localhost:3000";
    
    const response = await fetch(`${baseURL}/api/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({targetIndex})
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

        const docPath = path.resolve(process.cwd(), "/docs");
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
        


    } catch (err) {
        console.error(err);
    }
}

export async function createIndexIfNecessary (indexName: string) {  
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

export async function readMetadata() : Promise<Document["metadata"][]> {
    try {
        const filePath = path.resolve(process.cwd(), "/docs/metadata.json");
    } catch (err) {

    }
}


export async function pineconeIndexHasVectors (indexName: string) {
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