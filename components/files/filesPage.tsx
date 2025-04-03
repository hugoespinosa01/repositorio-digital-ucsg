"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from '@/components/documents/loading';
import GetBackButton from '../getback-button';
import { GetColumns } from '../dataTable/Columns';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Check, CheckCircle, DownloadIcon, File, FileDown, Table, Trash, TrashIcon } from 'lucide-react';
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
import MateriasDataTable from '../advanced-datatable';
import {
  Pill,
  PillAvatar,
  PillButton,
  PillStatus,
  PillIndicator,
  PillDelta,
  PillIcon,
  PillAvatarGroup,
} from '../pill';

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
  PromMateriasAprobadas: number;
  PromGraduacion: number;
}

export default function FilesPage({ fileId }: { fileId?: string | null }) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [detalleMaterias, setDetalleMaterias] = useState<KardexDetalle[]>([]);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openModalDelete, setOpenModalDelete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { permissions } = useAuthRoles();

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

  const canListMaterias = hasPermission("res:materias", "list");
  const canCreateMateria = hasPermission("res:materias", "create");
  const canUpdateMateria = hasPermission("res:materias", "update");
  const canDeleteMateria = hasPermission("res:materias", "delete");

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
    <Card className="p-2 sm:p-5 mt-5">
      <CardHeader className="gap-y-2 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>
          <p className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
            {fileData?.NombreArchivo}
            {/* {fileData && (
              <Pill className='ml-4'>
                <PillStatus>
                  <File className="mr-2" size={15} />
                </PillStatus>
                Borrador
              </Pill>
            )} */}
          </p>
          {fileData && <GetBackButton />}
        </CardTitle>

        <div className='flex justify-between space-x-3'>
          {/* <Button
            size={"sm"}
            variant={"default"}
            className="w-full sm:w-auto mt-2 lg:mt-0"
          >
            <CheckCircle className="mr-2" size={15} />
            Validar
          </Button> */}

          {hasPermission("res:documents", "delete") && fileData && (
            <Button
              variant={"destructive"}
              onClick={handleDelete}
              size={"sm"}
              className="w-full sm:w-auto mt-2 lg:mt-0"
            >
              <Trash className="mr-2" size={15} />
              Eliminar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="container mx-auto p-4">
            <LoadingFilePage />
          </div>
        ) : (
          <div className="container mx-auto p-2 sm:p-4">
            {/* Contenedor flexible para manejar la disposición */}
            <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6">
              {/* PDF Viewer - Proporción fija */}
              <div className="w-full lg:w-[45%] lg:h-[500px]">
                <PDFViewerComponent pdfUrl={fileUrl} />
              </div>

              {/* Datos del estudiante - Proporción fija */}
              <div className="w-full lg:w-[55%]">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">
                  Información del estudiante
                </h2>

                {/* Botones */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={"default"}
                    size={"sm"}
                    onClick={handleDownloadFile}
                    className="w-full sm:w-auto"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                  <Button
                    variant={"default"}
                    onClick={handleDownloadReport}
                    size={"sm"}
                    className="w-full sm:w-auto"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Descargar reporte
                  </Button>
                </div>

                {/* Campos de información */}
                <div className="space-y-4 sm:space-y-2">
                  {/* Nombre del estudiante */}
                  <div className="w-full">
                    <InputDemo
                      label="Estudiante:"
                      id="Alumno"
                      value={fileData?.Alumno}
                      vals={vals}
                    />
                  </div>

                  {/* ID y Carrera */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2">
                      <InputDemo
                        label="Número de identificación:"
                        id="NoIdentificacion"
                        value={fileData?.NoIdentificacion}
                        vals={vals}
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <InputDemo
                        label="Carrera:"
                        value={fileData?.Carrera}
                        id="Carrera"
                        vals={vals}
                      />
                    </div>
                  </div>

                  {/* Nota y Referencia */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="lg:w-[40%] sm:w-1/2">
                      <InputNumber
                        label="Nota de seminario / graduación:"
                        value={fileData?.NotaGraduacionSeminario}
                        vals={vals}
                        id="NotaGraduacionSeminario"
                      />
                    </div>
                    <div className="lg:w-[60%] sm:w-1/2">
                      <InputNumber
                        label="Promedio de materias aprobadas:"
                        value={fileData?.PromMateriasAprobadas}
                        vals={vals}
                        id="PromMateriasAprobadas"
                      />
                    </div>
                  </div>

                  {/*Promedios */}
                  <div className="flex flex-col sm:flex-row gap-4">

                    <div className="lg:w-[40%] sm:w-1/2">
                      <InputNumber
                        label="Promedio de graduación:"
                        value={fileData?.PromGraduacion}
                        vals={vals}
                        id="PromGraduacion"
                      />
                    </div>
                    <div className="lg:w-[60%] sm:w-1/2">
                      <InputDemo
                        label="Referencia archivo:"
                        value={fileData?.RefArchivo}
                        noIcon={true}
                        id="RefArchivo"
                      />
                    </div>
                  </div>

                  {/* Tabla y Botón */}
                  <div className="w-full mt-5">
                    {/* Botón visible solo en móvil */}

                    {
                      canListMaterias && (
                        <>
                          <div className="block lg:hidden mt-5">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setOpenModal(true)}
                            >
                              <Table className="mr-2 h-4 w-4" />
                              Ver materias aprobadas
                            </Button>
                          </div>
                          {/* Datatable visible solo en desktop */}
                          <div className="hidden mt-5 lg:block overflow-x-auto">
                            <MateriasDataTable
                              setOpenModal={setOpenModal}
                              fileId={fileId}
                              canCreateMateria={canCreateMateria}
                              canUpdateMateria={canUpdateMateria}
                              canDeleteMateria={canDeleteMateria}
                            />
                          </div>
                        </>
                      )
                    }
                  </div>

                  {/* Modales */}
                  <ExpandKardexDetail
                    fileId={fileId}
                    canCreateMateria={canCreateMateria}
                    canUpdateMateria={canUpdateMateria}
                    canDeleteMateria={canDeleteMateria}
                    data={detalleMaterias || []}
                    setData={setDetalleMaterias}
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}