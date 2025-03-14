"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/custom-fileuploader';
import GetBackButton from '../getback-button';
import { Loader2, ArrowUpRight } from 'lucide-react';
import useAuthRoles from '@/hooks/useAuthRoles';
import Link from 'next/link';


const MAX_FILE_SIZE = 1024 * 1024 * 25; // 25MB MAX (AZURE LIMITA MAX 500 MB EN EL PLAN F0)

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittingVerDocumento, setIsSubmittingVerDocumento] = useState<boolean>(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const router = useRouter();

  const { permissions } = useAuthRoles();

  const hasPermission = (resource: string, action: string) => {
    return permissions.some(
      (perm) => perm.rsname === resource && perm.scopes.includes(`scope:${action}`)
    );
  };

  const { handleSubmit } = useForm();
  const { toast } = useToast();

  const onSubmit = async () => {
    setIsSubmitting(true);
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo PDF.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "El archivo es muy grande",
        variant: "destructive",
      });
      return;
    }

    try {
      //Aquí va el middleware para subir el archivo

      console.log("Subiendo archivo...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "El archivo se subió correctamente.",
          variant: "default",
        });
        // router.push("/documents?page=1");
        const data = await response.json();
        setFileId(data.data.Id);

      } else {
        const data = await response.json();
        toast({
          title: "Error al subir documento",
          description: data.message,
          variant: "destructive",
        });
      }
      console.log("Archivo subido");

    } catch (err: any) {
      console.log("Error al subir archivo", err);
      toast({
        title: "Error",
        description: err,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className='p-5 mt-5'>

      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle>
          <p className="text-2xl font-bold mb-4">Carga de documentos digitalizados</p>
          <GetBackButton />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="container mx-auto p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FileUpload
              file={file}
              setFile={setFile}
              isSubmitting={isSubmitting}
            />
            <div>
              <div className='mb-3'>
                <Link
                  href={'https://cuucsgedu-my.sharepoint.com/:f:/g/personal/hugo_espinosa01_cu_ucsg_edu_ec/EtJGLX5qhwFGh-wkWEiT9icBkLg1QRkorkbC-WRqKXpuKQ?e=IEqY7t'}
                  className='text-primary text-sm underline'
                  target='_blank'
                >
                  Ver ejemplos de documentos bien escaneados
                  <ArrowUpRight className='inline-block ml-1 h-4 w-4' />
                </Link>
              </div>
              <p>
                <strong>Consideraciones:</strong><br />
                • Solo se permiten archivos <strong>PDF</strong>.<br />
                • El tamaño máximo del archivo debe ser de <strong>25 MB</strong>.<br />
                • Digitalizar <strong>SIEMPRE</strong> el detalle de las notas aprobadas en las <strong>últimas páginas</strong> del archivo, si tuviera más de una página.<br />
                • No deben subirse documentos protegidos con contraseña.<br />
                • El documento debe ser <strong>legible</strong>.<br />
                • Se permite subir <strong>un documento por estudiante.</strong><br />
                • No se permiten cargas masivas.<br />
              </p>
            </div>
            {
              isSubmitting ? (
                <Button
                  disabled
                  size={"sm"}
                  className="w-full sm:w-auto min-w-[120px]"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </Button>
              ) :
                hasPermission("res:documents", "create") &&
                <Button type="submit" size={"sm"} className='w-full sm:w-auto min-w-[120px]'>
                  Cargar
                </Button>
            }
            {
              fileId &&
              <Button
                onClick={() => {
                  router.push(`/files/${fileId}`)
                }}
                size={"sm"}
                type='button'
                className='w-full sm:w-auto min-w-[120px] ml-6'
                variant={"secondary"}
              >
                Ver documento
              </Button>
            }
          </form>
        </div>
      </CardContent>
    </Card>
  );
}