import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddings } from "@/lib/pinecone";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    
    // 1. Initializa el cliente Pinecone
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // 2. Initializa los embeddings
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-ada-002",
    });

    // 3. Initialize PineconeVectorStore
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pc.Index(process.env.PINECONE_INDEX as string),
      namespace: "documentos-ucsg",
    });

    //const index = pc.index(process.env.PINECONE_INDEX as string);
    // // const status = await index.describeIndexStats();
    //const queryVector = await getEmbeddings(query);
    
    // const queryResult = await index.namespace("documentos-ucsg").query({
    //   vector: queryVector,
    //   topK: 5,
    //   includeMetadata: true,
    //   includeValues: true,
    // })

    //console.log('Query Request:', queryResult);
    
    // 4. Realiza la búsqueda usando el algoritmo heurístico de Maximal Marginal Relevance
    const retrieved = await vectorStore.maxMarginalRelevanceSearch(query, {
      k: 5,
    });

    // 5. Obtiene los documentos de la base de datos
    const results = await Promise.all(retrieved.map(async (result) => {
      const doc = await prisma?.documento.findUnique({
        where: {
          Id: result.metadata.fileId,
        },
      });
      return doc;
    }));

    return NextResponse.json({ message: "Documento buscado con éxito", results }, { status: 200 });
  } catch (error) {
    console.error("Error performing similarity search:", error);
    return NextResponse.json(
      { error: "Failed to perform similarity search" },
      { status: 500 }
    );
  }
}