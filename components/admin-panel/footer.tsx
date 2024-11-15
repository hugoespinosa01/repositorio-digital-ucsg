import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 md:mx-8 flex h-14 items-center">
        <p className="text-xs md:text-sm leading-loose text-muted-foreground text-left">
          {/* Hecho por Hugo Espinosa M. y Denisse Ibarra B.{" "}
          para la Universidad Católica de Santiago de Guayaquil{" "} */}
          <Link
            href="https://www.ucsg.edu.ec/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            UCSG
            <ArrowUpRight className="h-4 w-4 inline-block" />
          </Link>
        </p>
      </div>
    </div>
  );
}
