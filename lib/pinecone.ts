import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone" 
import { OpenAIApi, Configuration} from  'openai-edge'
import md5 from 'md5'
import { ExtractedData } from '@/types/extractedData';


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
    apiKey: process.env.PINECONE_API_KEY || "",
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