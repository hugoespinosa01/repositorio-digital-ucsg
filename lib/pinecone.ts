'use server';
import { Pinecone } from "@pinecone-database/pinecone"
import { OpenAIApi, Configuration } from 'openai-edge'
import { Documento } from "@/types/file";
import { Materia } from '@/types/materia';

// Crea un cliente de Pinecone
const getPineconeClient = () => {
    return new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
    });
};

// Crea un cliente de OpenAI
const openaiClient = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY || "",
}))

interface DatosExtraidos {
    alumno: string;
    noIdentificacion: string;
    carrera: string;
    materiasAprobadas: Materia[]
}

export async function loadToPinecone(fileName: string, document: Documento, fields: DatosExtraidos) {

    try {
        // 1. Creo el embedding del documento
        const embedding = await getEmbeddings(JSON.stringify(fields).replace("\\n", " "));

        // 2. Vectorizo el diccionario de datos
        const vector = [{
            id: document.RefArchivo,
            values: embedding,
            metadata: {
                text: JSON.stringify(fields).replace("\\n", " "),
                fileName: document.NombreArchivo,
                fileId: document.Id,
                carrera: fields.carrera,
                folderId: document.IdCarpeta ?? 0
            }
        }]

        // 3. Inserción a Pinecone
        const client = await getPineconeClient();
        const pineconeIndex = await client.index(process.env.PINECONE_INDEX || "documentos-ucsg");
        
        // Establezco un namespace para el índice (este va a aglomerar a todos los documentos)
        const namespace = pineconeIndex.namespace(process.env.PINECONE_NAMESPACE || "documentos-ucsg");

        await namespace.upsert(vector);

        console.log("Documentos subidos exitosamente a Pinecone");
    } catch (err) {
        console.error(err);
        throw new Error("Error al subir documentos a Pinecone");
    }

}

export async function getEmbeddings(text: string): Promise<number[]> {
    try {
        const response = await openaiClient.createEmbedding({
            model: "text-embedding-ada-002",
            input: text
        })
        const result = await response.json();
        return result.data[0].embedding;
    } catch (err) {
        console.error(err);
        throw new Error("Error al obtener los embeddings");
    }
}