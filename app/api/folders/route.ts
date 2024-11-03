import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { BlobServiceClient } from '@azure/storage-blob';
import sql from 'mssql';
import { prisma } from '@/lib/prisma';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

// Conexión a la base de datos
const dbSettings = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME || '',
}

export async function GET(request: NextRequest) {

  try {
    
    //Utilizo la conexión a la base de datos
    // const pool = await getConnection();
    // const result = await pool.request().query("SELECT * FROM Carpeta WHERE IdCarpetaPadre IS NULL");

    const page =  Number(request.nextUrl.searchParams.get('page'));
    const pageSize = Number(request.nextUrl.searchParams.get('page_size'));

    const carpetas = await prisma.carpeta.findMany({
      where: {
        IdCarpetaPadre: null,
        Estado: 1
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalLength = await prisma.carpeta.count({
      where: {
        IdCarpetaPadre: null,
        Estado: 1
      }
    });

    const result = {
      message: 'Consulta exitosa',
      status: 200,
      data: carpetas,
      length: totalLength,
      currentPage: page,
    }
    

    // const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    // const containerClient = blobServiceClient.getContainerClient(containerName);

    // // Check if the container exists
    // const containerExists = await containerClient.exists();
    
    // if (!containerExists) {
    //   console.error(`Container '${containerName}' does not exist`);
    //   return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    // }

    // const documents = [];
    // for await (const blob of containerClient.listBlobsFlat()) {
    //   const blobClient = containerClient.getBlobClient(blob.name);
    //   const properties = await blobClient.getProperties();
      
    //   documents.push({
    //     id: blob.name,
    //     title: properties.metadata?.title || 'Sin título',
    //     description: properties.metadata?.description || 'Sin descripción',
    //     uploadDate: properties.createdOn,
    //   });
    // }

  
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching folders:', error);
    const errResponse = {
      error: 'Error fetching folders',
      status: 500,
      message: error,
    }
    return NextResponse.json(errResponse);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.Nombre) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    if (typeof body.Nombre !== 'string') {
      return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
    }

    const newCarpeta = await prisma.carpeta.create({
      data: {
        Nombre: body.Nombre,
        IdCarpetaPadre: body.IdCarpetaPadre || null,
        FechaCreacion: new Date(),
        FechaActualizacion: new Date(),
        IdCarrera: body.IdCarrera || null,
        Estado: body.Estado || 1,
      }
    });
    
    const result = {
      message: 'Documento creado',
      status: 200,
      data: newCarpeta,
    }
    return NextResponse.json(result);

  }catch(err){
    console.error('Error creating document:', err);
    const errResponse = {
      error: 'Error creating document',
      status: 500,
      message: err,
    }
    return NextResponse.json(errResponse);
  }
}


export async function getConnection () {
  try {
    console.log('Conectando a la base de datos...');
    const pool = await sql.connect(dbSettings);
    return pool;

  } catch(err){
    console.error('Error connecting to database:', err);
    throw new Error('Error connecting to database');
  }
}