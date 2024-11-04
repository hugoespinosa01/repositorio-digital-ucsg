'use client';

import Link from "next/link";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import DocumentsPage from "../../../../components/documents/documentsPage";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Folder } from "@/types/folder";

export default function DocumentDetail() {

  const params = useParams<{ parentId: string }>();
  const [parent, setParent] = useState<Folder|null>(null);

  const fetchParent = async () => {
    // Fetch parent data
    const response = await fetch(`/api/folders/${params.parentId}`);
    const data = await response.json();
    setParent(data);
  }

  useEffect(() => {
    if (params.parentId) {
      fetchParent();
    }
  }, [params.parentId])


  const buildBreadcrumb = () => {
    //path
    const path = parent?.Ruta;
    // const pathArray = path.split('/');
    // const pathArrayFiltered = pathArray.filter((item) => item !== '');
    // const pathArrayFilteredLength = pathArrayFiltered.length;
    //name
    //const name = parent.Nombre;
  }



  return (
    <ContentLayout title="Sinergia">
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
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>ucsg</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DocumentsPage parentId={params.parentId} />
    </ContentLayout>
  )
}

