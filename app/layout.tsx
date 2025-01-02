import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { GeistSans } from 'geist/font/sans';
import { FolderProvider } from '@/context/folder-context'
import { ChildrenProvider } from '@/context/children-context';
import SessionProviderWrapper from '@/utils/sessionProviderWrapper';

export const metadata: Metadata = {
  title: 'Sinergia | Repositorio digital documental',
  description: 'Sistema de gestión de documentos con IA para la Facultad de Ingeniería de la Universidad Católica de Santiago de Guayaquil.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <html lang="es" suppressHydrationWarning>
        <body className={GeistSans.className}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <FolderProvider>
                <ChildrenProvider>
                  <div vaul-drawer-wrapper="" className="bg-background">
                    {children}
                  </div>
                </ChildrenProvider>
              </FolderProvider>
              <Toaster />
            </ThemeProvider>
        </body>
      </html>
    </SessionProviderWrapper>
  );
}