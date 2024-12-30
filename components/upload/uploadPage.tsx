"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/custom-fileuploader';
import GetBackButton from '../getback-button';
import { useContext } from 'react';
import { AuthContext } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();
  //const [token, setToken] = useState<string>('');

  const { handleSubmit } = useForm();
  const { toast } = useToast();
  const { token, keycloak } = useContext(AuthContext);

  useEffect(() => {

    async function checkIfAuthenticated() {
      if (!keycloak?.authenticated) {
        const loginUrl = await keycloak?.createLoginUrl();
        if (loginUrl) {
          router.push(loginUrl);
        }
      }
    }

    checkIfAuthenticated();

  }, [keycloak]);

  // useEffect(() => {
  //   if (keycloak?.token) {
  //     setToken(keycloak.token);
  //   }
  // }, [keycloak]);

  const onSubmit = async () => {
    setIsSubmitting(true);
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo PDF.",
        variant: "destructive",
      });
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
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "El archivo se subió correctamente.",
          variant: "default",
        });
        router.push("/documents?page=1");
      }
      console.log("Archivo subido");

    } catch (err) {
      toast({
        title: "Error",
        description: "Hubo un problema al subir el documento.",
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
          <h1 className="text-2xl font-bold mb-4">Carga de documentos digitalizados</h1>
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
              <p>
                <strong>Consideraciones:</strong><br />
                • El tamaño máximo del archivo debe ser de 10MB<br />
                • Solo se permiten archivos PDF
              </p>
            </div>
            {
              isSubmitting ? (
                <Button
                  disabled
                  className="w-full sm:w-auto min-w-[120px]"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </Button>
              ) :
                <Button type="submit" className='w-full sm:w-auto min-w-[120px]'>
                  Cargar
                </Button>
            }
          </form>
        </div>
      </CardContent>
    </Card>
  );
}