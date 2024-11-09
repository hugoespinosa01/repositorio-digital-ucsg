'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';

export default function Home() {




  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Repositorio Digital Documental
        </h1>

        <span className="max-w-[750px] mt-3 text-center text-lg font-light text-foreground">Gestiona tus documentos con inteligencia artificial</span>
        <div className="flex mt-6">
          <Link href="/login">
            <Button>Acceder</Button>
          </Link>
          <Link href="/documents?page=1">
            <Button variant="outline" className="ml-4">
              Ir a panel de control
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}