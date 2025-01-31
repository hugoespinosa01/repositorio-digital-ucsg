'use client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

function AuthLandingPage() {

  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn('keycloak', {
      callbackUrl: searchParams?.get('callbackUrl') || '/documents?page=1',
    });
    setLoading(false);
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background p-4">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-8">
          {/* SVG Ilustración */}
          <div className="w-32 h-32 mb-4 relative">
            <div className="absolute inset-0 bg-rose-100 dark:bg-rose-900/10 rounded-full opacity-20"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-rose-900 dark:text-rose-500 w-full h-full p-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>

          {/* Mensaje de Bienvenida */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenido a Sinergia
            </h1>
            <p className="text-muted-foreground">
              Por favor, inicia sesión para acceder al contenido
            </p>
          </div>

          {/* Botón de Inicio de Sesión */}
          <div className="w-full">
            <Button
              className="w-full bg-rose-900 hover:bg-rose-800 text-white transition-colors duration-200"
              onClick={handleLogin}
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      </Card>

      {/* Decorative Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.02] dark:opacity-[0.05]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-rose-900">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>
      </div>



    </div>
  );
}

export default AuthLandingPage;
