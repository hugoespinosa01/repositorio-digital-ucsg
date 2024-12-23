import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddings } from "@/lib/pinecone";

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // Initialize VoyageEmbeddings with correct inputType for queries
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-ada-002",
    });

    // Initialize PineconeVectorStore
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pc.Index(process.env.PINECONE_INDEX as string),
    });

    const index = pc.index(process.env.PINECONE_INDEX as string);
    const status = await index.describeIndexStats();
    const queryVector = await getEmbeddings(query);
    const res = await index.query({
      vector: queryVector,
      topK: 20,
      includeMetadata: true,
      includeValues: true,
      filter: {}
    })

    console.log(`query is: ${query}`);

    const retrieved = await vectorStore.similaritySearch(query, 2);

    // Filter to ensure results set is unique - filter on the metadata.id
    const results: any = retrieved.filter((result, index) => {
      return (
        index ===
        retrieved.findIndex((otherResult: any) => {
          return result.metadata.id === otherResult.metadata.id;
        })
      );
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Error performing similarity search:", error);
    return NextResponse.json(
      { error: "Failed to perform similarity search" },
      { status: 500 }
    );
  }
}