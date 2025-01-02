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
import LoadingBreadcrumb from "@/components/documents/loadingBreadcrumb";

export default function DocumentDetail() {

  const params = useParams<{ parentId: string }>();
  const [parent, setParent] = useState<Folder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const path = parent?.Ruta ?? '/';
  const pathArray = path.split('/');

  const parentIds = parent?.IdHijos ?? '';
  const parentArray = parentIds.split(',');

  const pathArrayWithoutEmpty = pathArray.filter(item => item !== '');

  const pathsForBreadcrumb = pathArrayWithoutEmpty.map((item, index) => {
    if (item !== '') {
      return {
        name: item,
        id: parentArray[index] ? Number(parentArray[index]) : 0
      }
    }
  });

  const fetchParent = async () => {
    // Fetch parent data
    setLoading(true);
    const response = await fetch(`/api/folders/${params.parentId}`);
    const res = await response.json();
    setParent(res.data);
    setLoading(false);
  }

  useEffect(() => {
    if (params.parentId) {
      fetchParent();
    }
  }, [params.parentId]);

  return (
    <ContentLayout title="Sinergia">
      {
        loading ? (
          <LoadingBreadcrumb />
        ) : (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Inicio</Link>
              </BreadcrumbLink >
            </BreadcrumbItem >
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={'/documents?page=1'}>Mis documentos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {
              parent && pathsForBreadcrumb.map((item, index) => {
                if (index === pathsForBreadcrumb.length - 1) {
                  return (
                    <>
                      <BreadcrumbSeparator key={index + 1} />
                      <BreadcrumbItem key={index}>
                        <BreadcrumbPage>
                          {item?.name}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )
                } else {
                  return (
                    <>
                      <BreadcrumbSeparator key={index + 1}/>
                      <BreadcrumbItem key={index}>
                        <BreadcrumbLink asChild>
                          <Link href={`/documents/${item?.id}?page=1`}>{item?.name}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </>
                  )
                }
              })
            }
          </BreadcrumbList >
        </Breadcrumb >)
      }

      <DocumentsPage parentId={params.parentId} />
    </ContentLayout >
  )
}

