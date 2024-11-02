import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface Params {
  params: { id: string };
}


export async function GET(request: Request, {params} : Params) {
  try {

    const carpeta = await prisma.carpeta.findUnique({
      where: {
        Id: Number(params.id),
        Estado: 1
      }
    });

    if (!carpeta) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
    }

    const response = {
      message: 'Consulta exitosa',
      status: 200,
      data: carpeta
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching documents:', error);
  
    return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
  }
}

export async function DELETE(request : Request, {params} : Params) {
    try {
      
        // Se hace un borrado lógico de la carpeta
        const softDeletedCarpeta = await prisma.carpeta.update({
            where: {
                Id: Number(params.id)
            },
            data: {
              Estado: 0,
              FechaActualizacion: new Date()
            }
        })

        const response = {
            message: 'Carpeta eliminada',
            status: 200,
            data: softDeletedCarpeta
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error deleting document:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ error: 'Carpeta o documento no encontrada' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Error deleting document' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Params) {
    try {

        const body = await request.json();

        if (!body.Nombre) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
        }

        if (typeof body.Nombre !== 'string') {
            return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
        }

        const updatedCarpeta = await prisma.carpeta.update({
            where: {
                Id: Number(params.id)
            },
            data: {
                Nombre: body.Nombre,
                FechaActualizacion: new Date()
            }
        });

        const response = {
            message: 'Carpeta actualizada',
            status: 200,
            data: updatedCarpeta
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating document:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
              return NextResponse.json({ error: 'Carpeta o documento no encontrado' }, { status: 404 });
          }
      }
        return NextResponse.json({ error: 'Error updating document' }, { status: 500 });
    }
}

