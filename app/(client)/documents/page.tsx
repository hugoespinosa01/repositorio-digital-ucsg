"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface Document {
  id: string;
  title: string;
  description: string;
  uploadDate: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/documents');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setDocuments(data);
          } else {
            console.error('Unexpected response format:', data);
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
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [toast]);

  return (
   <Card className='p-5 mt-5'>
     <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Documentos</h1>
      {isLoading ? (
        <p>Cargando documentos...</p>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle>{doc.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{doc.description}</p>
                <p className="text-sm text-gray-500">Subido el: {new Date(doc.uploadDate).toLocaleDateString()}</p>
                <Link href={`/documents/${doc.id}`}>
                  <Button className="mt-2">Ver Detalles</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No hay documentos disponibles.</p>
      )}
      <Link href="/subirDocumento">
        <Button className="mt-4">Subir Nuevo Documento</Button>
      </Link>
    </div>
   </Card>
  );
}