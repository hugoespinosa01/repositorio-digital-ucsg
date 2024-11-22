"use client";

import {  useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from '@/components/documents/loading';
import { useContext } from 'react';
import { FolderContext } from '@/context/folder-context';
import { ChildrenContext } from '@/context/children-context';
import { useSearchParams } from 'next/navigation';
import GetBackButton from '../getback-button';
import { AuthContext } from '@/context/auth-context';
import Datatable from '../dataTable/Datatable';
import { GetColumns } from '../dataTable/Columns';
import { useRouter } from 'next/navigation';

interface FileData {
  Estado: number;
  Extension: string;
  FechaCarga : string;
  Id : number;
  IdCarpeta : number;
  NombreArchivo : string;
  RefArchivo : string;
  Ruta : string;
  Tamano  : number;
  Tipo : string;
}

export default function FilesPage({ fileId }: { fileId?: string | null }) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const columns = useMemo(() => GetColumns(), []);
  const currentPage = Number(searchParams.get('page'));
  const { loadingChildren } = useContext(ChildrenContext);
  const PAGE_SIZE = 6;
  //Para autenticación
  const { keycloak } = useContext(AuthContext);

  console.log('fileId:', fileId);


  useEffect(() => {
    if (currentPage < 1 || isNaN(currentPage)) {
      router.push('/pageNotFound');
      return;
    }
    if (fileId && keycloak) {
      if (keycloak.token) {
        fetchFile(fileId);
      }
    }

  }, [currentPage, keycloak]);


  const fetchFile = async (fileId: string) => {
    setLoading(true);
    const response = await fetch(`/api/files/${Number(fileId)}`, {
      headers: {
        'Authorization': keycloak?.token ? `Bearer ${keycloak.token}` : '',
      }
    })

    const res = await response.json();
    setFileData(res.data);
    setLoading(false);
  }


  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">Archivo detalle</h1>
          <GetBackButton />
        </CardTitle>
      </CardHeader>

      <CardContent>
        {(loading) ? (
          <div className="container mx-auto p-4">
            <LoadingDocuments />
          </div>
        ) :
          (
            <div className="container mx-auto p-4">
              <strong>Estudiante: </strong>
              <p>{fileData?.NombreArchivo}</p>
              <div className='w-full'>
                <Datatable
                  title='Detalle de materias aprobadas'
                  description=''
                  columns={columns}
                  data={[]}
                />
              </div>
            </div>
          )}
      </CardContent>
    </Card >
  );
}