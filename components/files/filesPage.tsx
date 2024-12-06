"use client";

import { useEffect, useMemo, useState } from 'react';
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
import { AspectRatio } from '../ui/aspect-ratio';
import PDFViewer from '../pdf-viewer';
import { Button } from '../ui/button';
import { DownloadIcon, File, FileDown } from 'lucide-react';
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/custom-modal";


interface FileData {
  Estado: number;
  Extension: string;
  FechaCarga: string;
  Id: number;
  IdCarpeta: number;
  NombreArchivo: string;
  RefArchivo: string;
  Ruta: string;
  Tamano: number;
  Tipo: string;
}

export default function FilesPage({ fileId }: { fileId?: string | null }) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const columns = useMemo(() => GetColumns(), []);
  const currentPage = Number(searchParams.get('page'));
  const { loadingChildren } = useContext(ChildrenContext);
  const PAGE_SIZE = 6;
  //Para autenticación
  const { keycloak } = useContext(AuthContext);



  useEffect(() => {
    if (currentPage < 1 || isNaN(currentPage)) {
      router.push('/pageNotFound');
      return;
    }
    //if (fileId && keycloak) {
    //if (keycloak.token) {
    if (fileId) {
      fetchFile(fileId);
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

  const onClickExpand = () => {
    setOpenModal(true);
  };


  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">Detalle del archivo</h1>
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
              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <PDFViewer
                  pdfUrl='/pdf/sample.pdf'
                />
                <div>
                  <h2 className="text-2xl font-bold mb-4 col-span-2 md:col-span-1">Información del estudiante</h2>

                  <div className="p-0 justify-between">

                    <Button
                      variant={'default'}
                      className='mr-4'
                    >
                      <DownloadIcon className='mr-5' />
                      Descargar archivo
                    </Button>
                    <Button
                      variant={'default'}
                    >
                      <FileDown className='mr-3' />
                      Descargar reporte
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 mt-5 mb-2">
                    <dt className="font-semibold">Estudiante:</dt>
                    <dd>{fileData?.NombreArchivo}</dd>
                  </div>
                  <div className="grid grid-cols-2 mb-2">
                    <dt className="font-semibold">Número de identificación:</dt>
                    <dd>{fileData?.Extension}</dd>
                  </div>
                  <div className="grid grid-cols-2 mb-2">
                    <div className="font-semibold">Carrera:</div>
                    <div>{fileData?.RefArchivo}</div>
                  </div>
                  <div className="grid grid-cols-2 mb-2">
                    <div className="font-semibold">Nota de seminario / graduación:</div>
                    <div>{fileData?.RefArchivo}</div>
                  </div>

                  <div className='w-full mt-5'>
                    <Datatable
                      title='Detalle de materias aprobadas'
                      description=''
                      columns={columns}
                      data={[]}
                      onClickExpand={onClickExpand}
                    />
                  </div>

                  <Credenza open={openModal} onOpenChange={setOpenModal}>
                    <CredenzaContent>
                      <CredenzaHeader>
                        <CredenzaTitle>
                          Confirmación
                        </CredenzaTitle>
                      </CredenzaHeader>
                      <CredenzaDescription>
                        <div className="text-center sm:text-start">
                          Eliminar carpeta
                        </div>
                      </CredenzaDescription>
                      <CredenzaBody>
                        Hola
                      </CredenzaBody>
                      <CredenzaFooter>
                        <Button variant="default">Aceptar</Button>
                        <CredenzaClose asChild>
                          <Button variant="secondary">Cancelar</Button>
                        </CredenzaClose>
                      </CredenzaFooter>
                    </CredenzaContent>
                  </Credenza>



                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card >
  );
}