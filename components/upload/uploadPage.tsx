"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/custom-fileuploader';
import GetBackButton from '../getback-button';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const { toast } = useToast();


  const onSubmit = async () => {
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
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "El archivo se subió correctamente.",
          variant: "default",
        });
        router.push("/documents?page=1");
      }

      console.log(response);

    } catch (err) {
      toast({
        title: "Error",
        description: "Hubo un problema al subir el documento.",
        variant: "destructive",
      });
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
            />
            <div>
              <p>
                <strong>Consideraciones:</strong><br />
                • El tamaño máximo del archivo debe ser de 10MB<br />
                • Solo se permiten archivos PDF
              </p>
            </div>
            <Button type="submit">Cargar</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}