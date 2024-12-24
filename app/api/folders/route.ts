import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { checkCarrera } from '@/utils/checkCarrera';
import { searchParentFolders } from '@/utils/searchParentFolders';

export async function GET(request: NextRequest) {
  try {

    const carrera = request.headers.get('x-carrera');
    let rootFolder = null;

    if (!carrera) {
      return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 400 });
    }

    const carreraId = await checkCarrera(carrera);
    const page = Number(request.nextUrl.searchParams.get('page'));
    const pageSize = Number(request.nextUrl.searchParams.get('page_size'));

    const carpetas = await prisma.carpeta.findMany({
      where: {
        IdCarpetaPadre: null,
        Estado: 1,
        IdCarrera: {
          in: carreraId
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    if (carpetas.length === 0) {
      //Busco la carpeta raíz
      rootFolder = await prisma.carpeta.findFirst({
        where: {
          IdCarpetaPadre: null,
          Estado: 1,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    }

    const totalLength = await prisma.carpeta.count({
      where: {
        IdCarpetaPadre: null,
        Estado: 1
      }
    });

    const result = {
      message: 'Consulta exitosa',
      status: 200,
      data: carpetas.length > 0 ? carpetas : [rootFolder],
      length: totalLength,
      currentPage: page,
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching folders:', error);
    const errResponse = {
      error: 'Error fetching folders',
      message: error,
    }
    return NextResponse.json(errResponse, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {

    //Verificamos la carrera asignada al usuario autenticado
    const carrera = request.headers.get('x-carrera');
    const body = await request.json();
    var ruta = "";

    if (!carrera) {
      return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 400 });
    }

    if (!body.Nombre) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    if (typeof body.Nombre !== 'string') {
      return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
    }

    const carreraId = await checkCarrera(carrera);

    const parentFoldersList = await searchParentFolders(body.IdCarpetaPadre);

    for (const parentFolder of parentFoldersList) {
      ruta += `/${parentFolder.Nombre}`;
    }

    const newCarpeta = await prisma.carpeta.create({
      data: {
        Nombre: body.Nombre,
        IdCarpetaPadre: body.IdCarpetaPadre || null,
        FechaCreacion: new Date(),
        FechaActualizacion: new Date(),
        IdCarrera: carreraId[0] || null,
        Estado: 1,
        Tipo: 'Carpeta',
        Ruta: ruta,
        IdHijos: "",
      }
    });

    const result = {
      message: 'Documento creado',
      status: 200,
      data: newCarpeta,
    }
    return NextResponse.json(result);

  } catch (err) {
    console.error('Error creating document:', err);
    const errResponse = {
      error: 'Error creating document',
      status: 500,
      message: err,
    }
    return NextResponse.json(errResponse);
  }
}