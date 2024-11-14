import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {

    const page = Number(request.nextUrl.searchParams.get('page'));
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
        Tipo: 'Carpeta',
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