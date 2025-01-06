'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContainerScroll } from "@/components/scroll-custom-comp";
import Image from "next/image";
import screen from "@/img/screen.png";
import { IconCloud } from '@/components/icon-cloud';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { LogoutButton } from '@/components/logoutButton';

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
]


export default function Home() {

  const searchParams = useSearchParams();

  const { data: session, status } = useSession();

  const handleLogin = async () => {
    await signIn('keycloak', {
      callbackUrl: searchParams?.get('callbackUrl') || '/',
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="min-h-[calc(100vh-57px-97px)] flex-1">
        <div className='container relative pb-10'>
          <section className="mx-auto mt-32 flex max-w-[980px] flex-col items-center gap-4 py-10 md:py-12 md:pb-8 lg:py-24 lg:pb-6">
            <h1 className="text-6xl font-bold drop-shadow-[0px_0px_45px_rgba(255,0,123,0.7)]">
              Sinergia
            </h1>

            <span className="max-w-[750px] mt-3 text-center text-lg font-light text-foreground">Gestiona tus documentos con inteligencia artificial</span>
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
                      <LogoutButton/>
                    </>
                  ) :
                    /* Si no está autenticado */
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

          <div className="w-full flex">
            <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden rounded-lg border bg-background px-20 pb-20 pt-8 ">
              <IconCloud iconSlugs={slugs} />
            </div>
            <div className='mx-auto ml-28 flex items-center'>
              <h4
                className='text-2xl text-foreground'
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
          <p className='text-balance text-center text-sm leading-loose text-muted-foreground'>
            Hecho por Hugo Espinosa y Denisse Ibarra para la UCSG. Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}