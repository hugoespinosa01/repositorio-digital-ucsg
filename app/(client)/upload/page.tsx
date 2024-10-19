"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/components/ui/use-toast';
import { Inbox } from 'lucide-react';
import { Card } from '@/components/ui/card';

const MAX_FILE_SIZE = '10MB';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const { toast } = useToast();

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const onSubmit = async (data: any) => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo PDF.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(data));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Documento subido correctamente.",
        });
        router.push('/documents');
      } else {
        throw new Error('Error al subir el documento');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al subir el documento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className='p-5 mt-5'>
      <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Carga de documentos digitalizados</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className='p-2 bg-white rounded-xl'>
          <div {...getRootProps()} className="border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className='mt-2 text-sm text-slate-500'>Suelta el archivo aquí...</p>
            ) : (
            <>
              <Inbox className='w-10 h-10 text-slate-500' />
              <p className='mt-2 text-sm text-slate-400'>Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionar</p>
            </>
            )}
          </div>
        </div>
        {file && <p>Archivo seleccionado: {file.name}</p>}
        <div>
          <p><strong>Consideraciones:</strong><br/>El tamaño máximo del archivo debe ser de {MAX_FILE_SIZE}</p>
        </div>
      </form>
    </div>
    </Card>
  );
}