import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

interface Params {
    params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const page = Number(request.nextUrl.searchParams.get('page'));
        const pageSize = Number(request.nextUrl.searchParams.get('page_size'));

        const carpetas = await prisma.carpeta.findMany({
            where: {
                IdCarpetaPadre: Number(params.id),
                Estado: 1
            }
        });

        const documentos = await prisma.documento.findMany({
            where: {
                IdCarpeta: Number(params.id),
                Estado: 1
            }
        });

        const countDocumentos = await prisma.documento.count({
            where: {
                IdCarpeta: Number(params.id),
                Estado: 1
            }
        });

        const countCarpetas = await prisma.carpeta.count({
            where: {
                IdCarpetaPadre: Number(params.id),
                Estado: 1
            }
        });

        const data = new Array();
        data.push(...carpetas);
        data.push(...documentos);
        const resultData = data.slice((page - 1) * pageSize, page * pageSize);

        const response = {
            message: 'Consulta exitosa',
            status: 200,
            data: resultData,
            page: page,
            pageSize: pageSize,
            length: countDocumentos + countCarpetas
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching folders:', error);

        return NextResponse.json({ error: 'Error fetching folders' }, { status: 500 });
    }
}
