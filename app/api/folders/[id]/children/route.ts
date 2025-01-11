import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';
import { checkCarrera } from '@/utils/checkCarrera';

interface Params {
    params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const carrera = session?.user.carrera.join();

        if (!carrera) {
            return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 400 });
        }

        const carreraArray = await checkCarrera(carrera);


        const page = Number(request.nextUrl.searchParams.get('page'));
        const pageSize = Number(request.nextUrl.searchParams.get('page_size'));

        const carpetas = await prisma.carpeta.findMany({
            where: {
                IdCarpetaPadre: Number(params.id),
                Estado: 1,
                OR: [
                    {
                        IdCarrera: null
                    },
                    {
                        IdCarrera: {
                            in: carreraArray.map(item => item.id)
                        },
                    }
                ]

            },
        });

        const documentos = await prisma.documento.findMany({
            where: {
                IdCarpeta: Number(params.id),
                Estado: 1,
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
                Estado: 1,
                OR: [
                    {
                        IdCarrera: null
                    },
                    {
                        IdCarrera: {
                            in: carreraArray.map(item => item.id)
                        },
                    }
                ]
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
