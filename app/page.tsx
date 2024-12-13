'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContainerScroll } from "@/components/scroll-custom-comp";
import Image from "next/image";

export default function Home() {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Repositorio Digital Documental
        </h1>
        <span className="max-w-[750px] mt-3 text-center text-lg font-light text-foreground">Gestiona tus documentos con inteligencia artificial</span>
        <div className="flex mt-6">
          <Link href={"/login"}>
            <Button>Acceder</Button>
          </Link>
          <Link href="/documents?page=1">
            <Button variant="outline" className="ml-4">
              Ir a panel de control
            </Button>
          </Link>
        </div>



      </main>
      <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-black dark:text-white">
                  Unleash the power of <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    Scroll Animations
                  </span>
                </h1>
              </>
            }
          >
            <Image
              src={`https://ui.aceternity.com/_next/image?url=%2Flinear.webp&w=3840&q=75`}
              alt="hero"
              height={720}
              width={1400}
              className="mx-auto rounded-2xl object-cover h-full object-left-top"
              draggable={false}
            />
          </ContainerScroll>
    </div>
  );
}