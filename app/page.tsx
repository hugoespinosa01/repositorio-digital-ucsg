import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Bienvenido al Repositorio Digital Documental
        </h1>
        <p className="mt-3 text-2xl">
          Gestiona tus documentos con inteligencia artificial
        </p>
        <div className="flex mt-6">
          <Link href="/upload">
            <Button>Subir Documento</Button>
          </Link>
          <Link href="/documents">
            <Button variant="outline" className="ml-4">
              Ver Documentos
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}