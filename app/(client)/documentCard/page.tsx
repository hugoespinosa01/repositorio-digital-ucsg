"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FolderOpen, Plus } from 'lucide-react';
import LoadingDocuments from './loading';
import Image from 'next/image';
import noDocuments from '../../../img/no_documents.png';

interface Document {
  Id: string;
  Nombre: string;
  IdCarpetaPadre: string;
  FechaCreacion: string;
  FechaActualizacion: string;
  IdCarrera: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const res = await response.json();

        if (Array.isArray(res.data)) {
          setDocuments(res.data);
        } else {
          console.error('Unexpected response format:', res);
          throw new Error('Formato de respuesta inesperado');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener los documentos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos. Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle> <h1 className="text-2xl font-bold mb-4">Documentos</h1>
        </CardTitle>
        <Link href="/subirDocumento">
          <Button className="mt-3">
            <Plus className='size-4 mr-2'></Plus>
            Subir Nuevo Documento</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="container mx-auto p-4">
            <LoadingDocuments />
          </div>
        ) : (
          <div className="container mx-auto p-4">
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.Id}>
                    <CardHeader>
                      <FolderOpen className='size-6'></FolderOpen>
                      <CardTitle>{doc.Nombre}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* <p>{doc.description}</p> */}
                      <p className="text-sm text-gray-500">Subido el: {new Date(doc.FechaCreacion).toLocaleDateString()}</p>
                      <Link href={`/documents/${doc.Id}`}>
                        <Button className="mt-2">Ver Detalles</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center'>
                <Image src={noDocuments} alt="No hay documentos" width={500} height={500} />
                <p className='text-2xl text-gray-500'>No se encontraron documentos.</p>
              </div>
            )}
          </div>
        )}

      </CardContent>

    </Card >
  );
}