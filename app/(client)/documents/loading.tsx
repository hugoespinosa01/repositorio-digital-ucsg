import CustomSkeleton from '@/components/custom-skeleton'
import React from 'react'
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function LoadingDocuments() {

  const array = new Array(6).fill(null);

  return (

    <ContentLayout title="Dashboard">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Panel de control</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className='p-5 mt-5'>
        <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
          <CardTitle> <h1 className="text-2xl font-bold mb-4">Documentos</h1>
          </CardTitle>
          <Link href="/subirDocumento">
            <Button className="mt-3">
              <Plus className='size-4 mr-2'></Plus>
              Subir Nuevo Documento</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="container mx-auto p-4">
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {array.map((_, x) => (
                <CustomSkeleton key={x} />
              ))}
            </div>

          </div>
        </CardContent>

      </Card>
    </ContentLayout>

  )
}
