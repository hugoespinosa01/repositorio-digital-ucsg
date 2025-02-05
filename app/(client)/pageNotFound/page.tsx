import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import notFound from '../../../public/not_found.jpg'
import Image from 'next/image';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function PageNotFound() {

  return (
    <ContentLayout title="Página no encontrada">
      <Card className='p-5 mt-5'>
        <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
          <CardTitle>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center'>
            <Image src={notFound} alt="Error 404" width={500} height={500} />
            <p className='text-2xl'>¡Oops! Parece que no es la página que buscabas</p>
            <div className="mt-5 justify-center text-center">
              <Link href={'/documents?page=1'}>
                <Button>
                  <Home size={20} className='mr-2' />
                  Ir al inicio
                </Button>
              </Link>
            </div>

          </div>
        </CardContent>
      </Card >
    </ContentLayout>
  );
}
