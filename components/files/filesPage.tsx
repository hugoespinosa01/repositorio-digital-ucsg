"use client";

import {  useEffect, useMemo } from 'react';
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

export default function FilesPage({ parentId }: { parentId?: string | null }) {
  const searchParams = useSearchParams();
  const columns = useMemo(() => GetColumns(), []);
  const currentPage = Number(searchParams.get('page'));
  const { loading } = useContext(FolderContext);
  const { loadingChildren } = useContext(ChildrenContext);

  //Para autenticación
  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    // if (currentPage < 1 || isNaN(currentPage)) {
    //   router.push('/pageNotFound');
    //   return;
    //}
    if (parentId && keycloak) {
      if (keycloak.token) {
        //fetchChildren(parentId, currentPage, PAGE_SIZE, keycloak?.token);
      }
    } else {
      // Fetch root folders
      if (keycloak) {
        if (keycloak.token) {
          //fetchFolders(currentPage, PAGE_SIZE, keycloak?.token);
        }
      }
    }

  }, [currentPage]);



  return (
    <Card className='p-5 mt-5'>

      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">Archivo detalle</h1>
          <GetBackButton />
        </CardTitle>
      </CardHeader>

      <CardContent>
        {(loading || loadingChildren) ? (
          <div className="container mx-auto p-4">
            <LoadingDocuments />
          </div>
        ) :
          (
            <div className="container mx-auto p-4">
              <strong>Estudiante: </strong>
              <p>Hugo Espinosa</p>
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