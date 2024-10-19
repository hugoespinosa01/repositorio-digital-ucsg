"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string;
  uploadDate: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const { toast } = useToast();


  useEffect(() => {
    const fetchDocuments = async () => {
      try {
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
      } 
    };

    fetchDocuments();
  }, [toast]);

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
        <div className="container mx-auto p-4">
          {documents.length > 0  && (
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
          )}
        </div>
      </CardContent>

    </Card>
  );
}