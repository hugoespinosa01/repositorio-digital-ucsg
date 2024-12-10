"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from '@/components/documents/loading';
import { useContext } from 'react';
import { ChildrenContext } from '@/context/children-context';
import { useSearchParams } from 'next/navigation';
import GetBackButton from '../getback-button';
import { AuthContext } from '@/context/auth-context';
import Datatable from '../dataTable/Datatable';
import { GetColumns } from '../dataTable/Columns';
import { useRouter } from 'next/navigation';
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
import PDFViewerComponent from '../pdf-viewer';
import InputDemo from '../inputtext';


interface FileData {
  NombreArchivo: string;
  Ruta: string;
  FechaCarga: string;
  RefArchivo: string;
  Alumno: string;
  Carrera: string;
  NoIdentificacion: string;
  DetalleMaterias: any[];
}

export default function FilesPage({ fileId }: { fileId?: string | null }) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const columns = useMemo(() => GetColumns(), []);
  const currentPage = Number(searchParams.get('page'));
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

    //Traigo los datos del archivo
    const response = await fetch(`/api/files/${Number(fileId)}`, {
      headers: {
        'Authorization': keycloak?.token ? `Bearer ${keycloak.token}` : '',
      }
    })

    if (!response.ok) {
      throw new Error(`Error al obtener el archivo: ${response.statusText}`);
    }

    const res = await response.json();

    //Obtengo el archivo PDF
    const blobResponse = await fetch(`/api/blob/${res.data.RefArchivo}`, {
      headers: {
        'Authorization': keycloak?.token ? `Bearer ${keycloak.token}` : '',
      }
    });

    if (!blobResponse.ok) {
      throw new Error(`Error al obtener el archivo: ${blobResponse.statusText}`);
    }

    const blob = await blobResponse.blob();

    //Creo una URL para el archivo PDF
    setFileUrl(URL.createObjectURL(blob));

    //Seteo los datos del archivo
    setFileData(res.data);
    setLoading(false);
  }

  const onClickExpand = () => {
    setOpenModal(true);
  };

  const downloadFile = () => {
    window.open(fileUrl, '_blank');
  }

  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">Detalle del archivo {fileData?.NombreArchivo}</h1>
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

                <div className="container mx-auto p-4 sm:block">
                  <PDFViewerComponent
                    pdfUrl={fileUrl}
                  />
                </div>

                <div className='sm:block'>
                  <h2 className="text-2xl font-bold mb-4 col-span-2 md:col-span-1">Información del estudiante</h2>
                  <div className="p-0 justify-between">
                    <Button
                      variant={'default'}
                      className='mr-4'
                      onClick={downloadFile}
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

                  <div className="grid grid-cols-2 mt-5 mb-2 space-x-3">
                    <InputDemo
                      label='Estudiante:'
                      value={fileData?.Alumno}
                    />

                  </div>


                  <div className="grid grid-cols-2 mb-2 space-x-3">
                    <InputDemo
                      label='Número de identificación:'
                      value={fileData?.NoIdentificacion}
                    />
                    <InputDemo
                      label='Carrera:'
                      value={fileData?.Carrera}
                    />

                  </div>

                  <div className="grid grid-cols-2 mb-2 space-x-3">
                    <InputDemo
                      label='Nota de seminario / graduación:'
                      value={fileData?.Carrera}
                    />
                    <InputDemo
                      label='Referencia archivo:'
                      value={fileData?.RefArchivo}
                      noIcon={true}
                    />
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