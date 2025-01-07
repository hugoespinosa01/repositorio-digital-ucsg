import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { checkCarrera } from '@/utils/checkCarrera';
import { searchParentFolders } from '@/utils/searchParentFolders';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {

    // Obtengo la sesión
    const session = await getServerSession(auth);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtengo la carrera asignada al usuairo
    const carrera = session?.user.carrera.join();
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
        OR: [
          {
            IdCarrera: null
          },
          {
            IdCarrera: {
              in: carreraId.map(item => item.id)
            },
          }
        ]
      },

      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // if (carpetas.length === 0) {
    //   //Busco la carpeta raíz
    //   rootFolder = await prisma.carpeta.findFirst({
    //     where: {
    //       IdCarpetaPadre: null,
    //       Estado: 1,
    //     },
    //     skip: (page - 1) * pageSize,
    //     take: pageSize,
    //   });
    // }

    const totalLength = await prisma.carpeta.count({
      where: {
        IdCarpetaPadre: null,
        Estado: 1,
        OR: [
          {
            IdCarrera: null
          },
          {
            IdCarrera: {
              in: carreraId.map(item => item.id)
            },
          }
        ]
      },
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

    const session = await getServerSession(auth);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtengo la carrera asignada al usuario
    const carrera = session?.user.carrera.join();

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
    let parentFoldersList = [];

    if (body.IdCarpetaPadre) {
      parentFoldersList = await searchParentFolders(body.IdCarpetaPadre);
      for (const parentFolder of parentFoldersList.sort((a, b) => a.Id - b.Id)) {
        ruta += `/${parentFolder?.Nombre}`;
      }
    } 

    ruta += `/${body.Nombre}`;

    const newCarpeta = await prisma.carpeta.create({
      data: {
        Nombre: body.Nombre,
        IdCarpetaPadre: body.IdCarpetaPadre || null,
        FechaCreacion: new Date(),
        FechaActualizacion: new Date(),
        IdCarrera: carreraId.length > 1 ? null : carreraId[0].id,
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