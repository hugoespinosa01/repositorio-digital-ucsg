import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";

export async function POST(req: Request) {

  const start = Date.now(); // Marca de tiempo inicial

  const session = await getServerSession(auth);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Obtengo la carrera asignada al usuario
  const carrera = session?.user.carrera.join();

  const { query, parentId } = await req.json();
  let results: any[] = [];

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // 1. Inicializa el cliente Pinecone
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // 2. Inicializa los embeddings
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-ada-002",
    });

    // 3. Inicializa PineconeVectorStore
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pc.Index(process.env.PINECONE_INDEX as string),
      namespace: "documentos-ucsg"
    });

    // 4. Realiza la búsqueda usando el algoritmo heurístico de Maximal Marginal Relevance
    let retrieved: any[] = [];

    if (parentId) {
      retrieved = await vectorStore.maxMarginalRelevanceSearch(query, {
        k: 3,
        filter: {
          carrera: {
            $in: carrera.split(','),
          },
          folderId: Number(parentId) || 0,
        },
      });
    } else {
      retrieved = await vectorStore.maxMarginalRelevanceSearch(query, {
        k: 3,
        filter: {
          carrera: {
            $in: carrera.split(','),
          },
        },
      });
    }

    let similarDocs: any[] = [];

    // 5. Verifica si el primer resultado contiene el query
    if (retrieved.length === 0 || !searchString(retrieved[0].metadata.fileName, query)) {
      // Si no contiene el query, realiza la búsqueda en la base de datos
      if (parentId) {
        similarDocs = await buscarDocumentos(Number(parentId), query, carrera);
      } else {
        similarDocs = await prisma?.tipoDocumentoKardex.findMany({
          where: {
            OR: [
              {
                NoIdentificacion: {
                  contains: query,
                },
              },
              {
                Alumno: {
                  contains: query.toUpperCase(),
                },
              },
            ],
            AND: [
              {
                Estado: 1,
              },
              {
                Carrera: {
                  in: carrera.split(','),
                },
              },
            ]
          },
        });
      }

      if (!similarDocs) {
        return NextResponse.json({ message: "Error al buscar documentos" }, { status: 500 });
      }

      // Obtiene los documentos de la base de datos
      results = await Promise.all(similarDocs.map(async (doc) => {
        const documento = await prisma?.documento.findUnique({
          where: {
            Id: doc.IdDocumento,
          },
        });
        return documento;
      }));
    } else {
      // Si contiene el query, obtiene los documentos de la base de datos
      results = await Promise.all(retrieved.map(async (result) => {
        const doc = await prisma?.documento.findUnique({
          where: {
            Id: result.metadata.fileId,
            Estado: 1,
          },
        });
        return doc;
      }));
      results = results.filter((x) => x != null);
    }

    return NextResponse.json({ message: "Documento buscado con éxito", results }, { status: 200 });

  } catch (error) {
    console.error("Error performing similarity search:", error);
    return NextResponse.json(
      { error: "Failed to perform similarity search" },
      { status: 500 }
    );
  } finally {
    const end = Date.now(); // Marca de tiempo al final
    console.log(`Tiempo total: ${end - start}ms`);
  }
}

function searchString(fullText: string, searchText: string): number {
  if (searchText.split(" ").filter(word => word.trim() !== "").some(word => fullText.includes(word))) {
    console.log("Coincide parcialmente");
    return 1;
  } else {
    console.log("No coincide");
    return 0;
  }
}


async function getCarpetasHijas(idCarpeta: number) {

  const carpetas = await prisma.carpeta.findMany({
    where: { IdCarpetaPadre: idCarpeta },
    select: { Id: true },
  });

  const idsHijas = carpetas.map((c) => c.Id);
  for (const id of idsHijas) {
    const idsNietas = await getCarpetasHijas(id); // Llamada recursiva
    idsHijas.push(...idsNietas);
  }
  return idsHijas;
}

async function buscarDocumentos(idCarpeta: number, query: string, carrera: string) {
  const carpetas = await getCarpetasHijas(idCarpeta);
  carpetas.push(idCarpeta); // Agrega la carpeta raíz

  const documentos = await prisma.tipoDocumentoKardex.findMany({
    where: {
      OR: [
        {
          NoIdentificacion: {
            contains: query,
          },
        },
        {
          Alumno: {
            contains: query.toUpperCase(),
          },
        },
      ],
      AND: [
        {
          Estado: 1,
        },
        {
          Carrera: {
            in: carrera.split(','),
          },
        },
        {
          Documento: {
            IdCarpeta: {
              in: carpetas
            }
          },
        }
      ]
    },
  });

  return documentos;
}
