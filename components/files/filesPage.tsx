"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from '@/components/documents/loading';
import { useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import GetBackButton from '../getback-button';
import { AuthContext } from '@/context/auth-context';
import Datatable from '../dataTable/Datatable';
import { GetColumns } from '../dataTable/Columns';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { DownloadIcon, FileDown } from 'lucide-react';
import PDFViewerComponent from '../pdf-viewer';
import InputDemo from '../inputtext';
import InputNumber from '../inputnumber';
import ExpandKardexDetail from '../modals/expand-kardex-detail-datatable';

interface FileData {
  NombreArchivo: string;
  Ruta: string;
  FechaCarga: string;
  RefArchivo: string;
  Alumno: string;
  Carrera: string;
  NotaGraduacionSeminario: number;
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

  const vals = {
    fileId: fileId,
    token: keycloak?.token
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

                  <div className="grid grid-cols-1 mt-5 mb-2 space-x-3">
                    <InputDemo
                      label='Estudiante:'
                      id='Alumno'
                      value={fileData?.Alumno}
                      vals={vals}
                    />
                  </div>


                  <div className="grid grid-cols-2 mb-2 space-x-3">
                    <InputDemo
                      label='Número de identificación:'
                      id='NoIdentificacion'
                      value={fileData?.NoIdentificacion}
                      vals={vals}
                    />
                    <InputDemo
                      label='Carrera:'
                      value={fileData?.Carrera}
                      id='Carrera'
                      vals={vals}
                    />
                  </div>

                  <div className="grid grid-cols-2 mb-2 space-x-3">
                    <InputNumber
                      label='Nota de seminario / graduación:'
                      value={fileData?.NotaGraduacionSeminario}
                      vals={vals}
                      id='NotaGraduacionSeminario'
                    />
                    <InputDemo
                      label='Referencia archivo:'
                      value={fileData?.RefArchivo}
                      noIcon={true}
                      id='RefArchivo'
                    />
                  </div>

                  {/* Tabla de materias aprobadas */}
                  <div className='w-full mt-5'>
                    <Datatable
                      title='Detalle de materias aprobadas'
                      description=''
                      columns={columns}
                      data={[]}
                      onClickExpand={onClickExpand}
                      showIcon={true}
                    />
                  </div>

                  {/* Modal para expandir detalle de materias aprobadas */}
                  <ExpandKardexDetail
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                  />

                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card >
  );
}