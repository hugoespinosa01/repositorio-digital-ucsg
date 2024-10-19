"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Subir Documento</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div {...getRootProps()} className="border-2 border-dashed p-4 text-center cursor-pointer">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Suelta el archivo aquí...</p>
          ) : (
            <p>Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionar</p>
          )}
        </div>
        {file && <p>Archivo seleccionado: {file.name}</p>}
        <div>
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...register('title')} />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input id="description" {...register('description')} />
        </div>
        <Button type="submit">Subir Documento</Button>
      </form>
    </div>
  );
}