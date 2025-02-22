'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContainerScroll } from "@/components/scroll-custom-comp";
import Image from "next/image";
import screen from "@/public/screen.png";
import { IconCloud } from '@/components/icon-cloud';
import { LayoutDashboard, Loader2, LogIn } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { LogoutButton } from '@/components/logoutButton';
import { useState } from 'react';
import { Hammersmith_One } from 'next/font/google';
import logosinergIA from '@/public/logo_sinergia.png';
import { Typewriter } from '@/components/typewriter';
import { Squares } from '@/components/background';

const slugs = [
  "typescript",
  "javascript",
  "react",
  "html5",
  "nodedotjs",
  "nextdotjs",
  "prisma",
  "vercel",
  "git",
  "github",
  "visualstudiocode",
  "tailwindcss",
];

const hammersmith = Hammersmith_One({
  subsets: ['latin'],
  weight: '400', // Define los pesos necesarios
  style: 'normal',
  display: 'swap'
})

export default function Home() {

  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const { data: session, status } = useSession();

  const handleLogin = async () => {
    setLoading(true);
    await signIn('keycloak', {
      callbackUrl: searchParams?.get('callbackUrl') || '/documents?page=1',
    });
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff000008_1px,transparent_1px),linear-gradient(to_bottom,#ff000008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <main className="min-h-[calc(100vh-57px-97px)] flex-1">
        <div className='container relative pb-10 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center min-h-screen'>
            <section className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-6 sm:py-10 md:py-12 lg:py-24">
              {/* Logo y Título */}
              <div className='flex items-center space-x-4'>
                <Image
                  src={logosinergIA}
                  alt="Logo sinergIA"
                  width={40}
                  height={40}
                  className="sm:w-[60px] sm:h-[60px]"
                />
                <h1 className={`text-4xl sm:text-6xl lg:text-8xl font-bold ${hammersmith.className} text-black dark:text-white`}>
                  sinergIA
                </h1>
              </div>

              {/* Subtítulo */}
              <span className="max-w-[90%] sm:max-w-[750px] mt-2 sm:mt-3 text-center text-base sm:text-2xl font-light text-black dark:text-white">
                Gestiona tus documentos con inteligencia artificial.
              </span>
              <Typewriter
                text={[
                  " Sube tus documentos.",
                  " Organiza tus archivos por categorías.",
                  " Busca cualquier documento con algoritmos heurísticos.",
                ]}
                className='max-w-[90%] sm:max-w-[750px] text-center text-base sm:text-lg font-medium text-primary dark:text-white'
                speed={70}
                waitTime={1500}
                deleteSpeed={40}
                cursorChar={"_"}
              />


              {/* Botones de autenticación */}
              <div className="flex w-full items-center justify-center space-x-2 sm:space-x-4 py-4">
                {status === 'loading' ? (
                  <Button variant={'default'} size={'sm'} disabled>
                    Cargando...
                  </Button>
                ) : status === 'authenticated' && session ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Link href={"/documents?page=1"}>
                      <Button variant={'default'} size={'sm'}>
                        Ir a panel de control
                        <LayoutDashboard className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <LogoutButton />
                  </div>
                ) : loading ? (
                  <Button variant="default" size={'sm'} disabled>
                    Iniciando sesión...
                    <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                  </Button>
                ) : (
                  <Button variant="default" size={'sm'} onClick={handleLogin}>
                    Iniciar sesión
                    <LogIn className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </section>
          </div>

          {/* Sección de Scroll Container */}
          <div className="w-full flex justify-center relative px-3 sm:px-0">
            <ContainerScroll
              titleComponent={
                <>
                  <h1 className="text-2xl sm:text-4xl  font-semibold">
                    Ahorra tiempo de digitación manual con<br />
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

          {/* Sección de Tecnologías */}
          <div className="w-full flex flex-col lg:flex-row gap-8 mt-8 sm:mt-16">
            <div className="relative flex w-full lg:max-w-lg items-center justify-center overflow-hidden rounded-lg border px-4 sm:px-20 py-8">
              <IconCloud iconSlugs={slugs} />
            </div>
            <div className='flex items-center justify-center lg:justify-start lg:ml-8 xl:ml-28 px-4'>
              <h4 className='text-xl sm:text-2xl text-center lg:text-left text-black dark:text-white'>
                Construido con las últimas tecnologías de vanguardia para la
                <span className='text-primary'> Facultad de Ingeniería</span>
              </h4>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 sm:py-6 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row px-4">
          <p className='text-balance text-center text-xs sm:text-sm leading-loose text-black dark:text-white'>
            Hecho por Hugo Espinosa y Denisse Ibarra para la UCSG. Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}