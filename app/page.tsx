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
    <div className="flex flex-col min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-red-50">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff000008_1px,transparent_1px),linear-gradient(to_bottom,#ff000008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <main className="min-h-[calc(100vh-57px-97px)] flex-1 ">
        <div className='container relative pb-10'>
          <div className='flex items-center justify-center h-screen'>
            <section className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-10 md:py-12 md:pb-8 lg:py-24 lg:pb-6">
              <div className='flex items-center space-x-4'>
                <Image
                  src={logosinergIA}
                  alt="Logo sinergIA"
                  width={60}
                  height={60}
                />
                <h1 className={`text-8xl font-bold text-black dark:text-white`}>
                  sinergIA
                </h1>
              </div>
              <span className="max-w-[750px] mt-3 text-center text-lg font-light text-black dark:text-white text-foreground">Gestiona tus documentos con inteligencia artificial</span>
              <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-6">
                {
                  /* Cuando el estado de autenticación se esté cargando */
                  status === 'loading' ? (
                    <Button
                      variant={'default'}
                      size={'sm'}
                      disabled
                    >Cargando...
                    </Button>
                  ) :
                    /* Cuando esté autenticado y haya una sesión vigente */
                    status === 'authenticated' && session ? (
                      <>
                        <Link href={"/documents?page=1"}>
                          <Button
                            variant={'default'}
                            size={'sm'}
                          >Ir a panel de control
                            <LayoutDashboard className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                        <LogoutButton />
                      </>
                    ) :
                      /* Si no está autenticado */

                      loading ? (
                        <Button
                          variant="default"
                          className="ml-4"
                          size={'sm'}
                          disabled
                        >
                          Iniciando sesión...
                          <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                        </Button>
                      ) :
                        (
                          <Button
                            variant="default"
                            className="ml-4"
                            onClick={handleLogin}
                            size={'sm'}
                          >
                            Iniciar sesión
                            <LogIn className="ml-2 w-4 h-4" />
                          </Button>

                        )
                }
              </div>
            </section>
          </div>
          <div className="w-full flex justify-center relative">
            <ContainerScroll
              titleComponent={
                <>
                  <h1 className="text-4xl font-semibold text-black dark:text-white">
                    Gestión documental con<br />
                    <span className="text-4xl md:text-[6rem] font-bold text-black dark:text-white mt-1 leading-none">
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

          <div className="w-full flex">
            <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden rounded-lg border bg-background px-20 pb-20 pt-8 ">
              <IconCloud iconSlugs={slugs} />
            </div>
            <div className='mx-auto ml-28 flex items-center'>
              <h4
                className='text-2xl text-foreground dark:text-white text-black'
              >
                Construido con las últimas tecnologías de vanguardia para la
                <span className='text-primary'> Falcultad de Ingeniería</span>
              </h4>
            </div>
          </div>

        </div>
      </main>
      <footer className="py-6 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className='text-balance text-center text-sm leading-loose text-muted-foreground text-black dark:text-white'>
            Hecho por Hugo Espinosa y Denisse Ibarra para la UCSG. Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}