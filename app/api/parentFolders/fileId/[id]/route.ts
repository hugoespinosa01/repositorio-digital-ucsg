import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';
import {  searchParentFoldersByFileId } from '@/utils/searchParentFolders';

interface Params {
    params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        let parentFoldersList = await searchParentFoldersByFileId(Number(params.id));


        const response = {
            message: 'Carpetas padres encontradas',
            status: 200,
            data: parentFoldersList
        }

        // if (!carpeta) {
        //     return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
        // }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json({ error: 'Error fetching document' }, { status: 500 });
    }

}