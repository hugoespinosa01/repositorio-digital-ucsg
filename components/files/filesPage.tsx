"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from '@/components/documents/loading';
import { useContext } from 'react';
import GetBackButton from '../getback-button';
import { AuthContext } from '@/context/auth-context';
import Datatable from '../dataTable/Datatable';
import { GetColumns } from '../dataTable/Columns';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { DownloadIcon, FileDown, Trash, TrashIcon } from 'lucide-react';
import PDFViewerComponent from '../pdf-viewer';
import InputDemo from '../inputtext';
import InputNumber from '../inputnumber';
import ExpandKardexDetail from '../modals/expand-kardex-detail-datatable';
import ConfirmDeleteFile from '../modals/confirm-delete-file';
import { KardexDetalle } from '@/types/kardexDetalle';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import useAuthRoles from '@/hooks/useAuthRoles';
import LoadingFilePage from './loading';

interface FileData {
  Id: number;
  NombreArchivo: string;
  Ruta: string;
  FechaCarga: string;
  RefArchivo: string;
  Alumno: string;
  Carrera: string;
  NotaGraduacionSeminario: number;
  NoIdentificacion: string;
  DetalleMaterias: [];
}

export default function FilesPage({ fileId }: { fileId?: string | null }) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [detalleMaterias, setDetalleMaterias] = useState<KardexDetalle[]>([]);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openModalDelete, setOpenModalDelete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();
  const { permissions } = useAuthRoles(true);

  useEffect(() => {

    if (fileId) {
      fetchFile(fileId);
    }

  }, [fileId]);

  const hasPermission = (resource: string, action: string) => {
    return permissions.some(
      (perm: any) => perm.rsname === resource && perm.scopes.includes(`scope:${action}`)
    );
  };

  const fetchFile = async (fileId: string) => {
    setLoading(true);

    //Traigo los datos del archivo
    const response = await fetch(`/api/files/${Number(fileId)}`);

    if (!response.ok) {
      throw new Error(`Error al obtener el archivo: ${response.statusText}`);
    }

    const res = await response.json();

    //Obtengo el archivo PDF
    const blobResponse = await fetch(`/api/blob/${res.data.RefArchivo}`);

    if (!blobResponse.ok) {
      throw new Error(`Error al obtener el archivo: ${blobResponse.statusText}`);
    }

    const blob = await blobResponse.blob();

    //Creo una URL para el archivo PDF
    setFileUrl(URL.createObjectURL(blob));

    //Seteo los datos del archivo
    setFileData(res.data);
    setDetalleMaterias(res.data.DetalleMaterias);
    setLoading(false);
  }

  const onClickExpand = () => {
    setOpenModal(true);
  };

  const handleDownloadFile = () => {
    window.open(fileUrl, '_blank');
  }

  const vals = {
    fileId: fileId
  }

  const handleDelete = () => {
    setOpenModalDelete(true);
  }

  // const handleAcceptDelete = async () => {
  //   setOpenModalDelete(false);

  //   const response = await fetch(`/api/files/${Number(fileId)}`, {
  //     method: 'DELETE',
  //   });

  //   if (!response.ok) {
  //     throw new Error(`Error al eliminar el archivo: ${response.statusText}`);
  //   }

  //   toast({
  //     title: "Confirmación",
  //     description: "La información ha sido eliminada exitosamente",
  //     variant: "default",
  //   });

  //   router.back();
  // }

  const onEdit = useCallback((row: any) => {
    console.log('Edit', row);
  }, []);

  const onDelete = useCallback((row: any) => {
    console.log('Delete', row);
  }, []);

  const columns = useMemo(() => GetColumns({ onEdit, onDelete }), []);

  const handleDownloadReport = async () => {
    window.open(`/files/${fileId}/report`, '_blank');
  }

  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>

        <CardTitle>
          <p className="text-2xl font-bold mb-4">Detalle del archivo {fileData?.NombreArchivo}</p>
          <GetBackButton />
        </CardTitle>

        {
          hasPermission('res:documents', 'delete') && (
            <Button
              variant={'destructive'}
              onClick={handleDelete}
              size={'sm'}
            >
              <Trash className='mr-2' size={15} />
              Eliminar
            </Button>
          )
        }

      </CardHeader>

      <CardContent>
        {(loading) ? (
          <div className="container mx-auto p-4">
            <LoadingFilePage />
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
                      size={'sm'}
                      onClick={handleDownloadFile}
                    >
                      <DownloadIcon className='h-4 w-4 mr-2' />
                      Descargar archivo
                    </Button>
                    <Button
                      variant={'default'}
                      onClick={handleDownloadReport}
                      size={'sm'}
                    >
                      <FileDown className='h-4 w-4 mr-2' />
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


                  <div className="flex mb-2 space-x-3">
                    <div className="w-2/5">
                      <InputDemo
                        label='Número de identificación:'
                        id='NoIdentificacion'
                        value={fileData?.NoIdentificacion}
                        vals={vals}
                      />
                    </div>
                    <div className="w-3/5"><InputDemo
                      label='Carrera:'
                      value={fileData?.Carrera}
                      id='Carrera'
                      vals={vals}
                    /></div>

                  </div>

                  <div className="flex space-x-3">
                    <div className='w-2/5'>
                      <InputNumber
                        label='Nota de seminario / graduación:'
                        value={fileData?.NotaGraduacionSeminario}
                        vals={vals}
                        id='NotaGraduacionSeminario'
                      />
                    </div>
                    <div className='w-3/5'>
                      <InputDemo
                        label='Referencia archivo:'
                        value={fileData?.RefArchivo}
                        noIcon={true}
                        id='RefArchivo'
                      />
                    </div>
                  </div>

                  {/* Tabla de materias aprobadas */}
                  <div className='w-full mt-5'>
                    <Datatable
                      title='Detalle de materias aprobadas'
                      description=''
                      columns={columns}
                      data={detalleMaterias || []}
                      setData={setDetalleMaterias}
                      onClickExpand={onClickExpand}
                      showIcon={true}
                    />
                  </div>

                  {/* Modal para expandir detalle de materias aprobadas */}
                  <ExpandKardexDetail
                    data={detalleMaterias || []}
                    setData={setDetalleMaterias}
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />

                  {/* Modal para confirmar eliminación de archivo */}
                  <ConfirmDeleteFile
                    pageSize={6}
                    currentPage={1}
                    openModal={openModalDelete}
                    setOpenModal={setOpenModalDelete}
                    fileId={Number(fileId)}
                  />

                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card >
  );
}