'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContainerScroll } from "@/components/scroll-custom-comp";
import Image from "next/image";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import screen from "@/img/screen.png";

export default function Home() {

  

  return (
    <div className="flex flex-col min-h-screen">
      <main className="min-h-[calc(100vh-57px-97px)] flex-1">
        <div className='container relative pb-10'>
          <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-6">
            <h1 className="text-6xl font-bold">
              Sinergia
            </h1>
            <span className="max-w-[750px] mt-3 text-center text-lg font-light text-foreground">Gestiona tus documentos con inteligencia artificial</span>
            <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-6">
              <Link href={"/documents?page=1"}>
                <Button>Ir a panel de control
                  <ArrowRightIcon className="ml-2" />
                </Button>
              </Link>
              <Link href="/documents?page=1">
                <Button variant="outline" className="ml-4">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </section>
          <div className="w-full flex justify-center relative">
            <ContainerScroll
              titleComponent={
                <>
                  <h1 className="text-4xl font-semibold text-black dark:text-white">
                    Gestión documental con<br />
                    <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                      Inteligencia Artificial
                    </span>
                  </h1>
                </>
              }
            >
              <Image
                src={screen}
                alt="hero"
                height={720}
                width={1350}
                className="mx-auto rounded-2xl object-cover h-full object-left-top"
                draggable={false}
              />
            </ContainerScroll>
          </div>
        </div>
      </main>
      <footer className="py-6 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className='text-balance text-center text-sm leading-loose text-muted-foreground'>
          Hecho por Hugo Espinosa y Denisse Ibarra para la UCSG. Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}