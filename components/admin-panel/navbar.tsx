import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/admin-panel/user-nav";
import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import Image from "next/image";
import logoSinergia from "@/public/logo_sinergia.png";
import { Hammersmith_One } from 'next/font/google';

interface NavbarProps {
  title: string;
}

const hammersmith = Hammersmith_One({
  subsets: ['latin'],
  weight: '400', // Define los pesos necesarios
  display: 'swap',        // Reduce el impacto del cambio de fuentes
})

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-rose-900 shadow backdrop-blur dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <div className="flex items-center space-x-1">
            <Image
              src={logoSinergia}
              alt="Logo SinergIA"
              width={23}
              height={23}
            />
            <h1 className={`font-bold text-white  ${hammersmith.className}`}>{title}</h1>
          </div>
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
