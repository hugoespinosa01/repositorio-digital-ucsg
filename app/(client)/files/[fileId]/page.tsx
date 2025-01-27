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
import FilesPage from "@/components/files/filesPage";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingBreadcrumb from "@/components/documents/loadingBreadcrumb";
import { Fragment } from "react";

type FileData = {
  Ruta: string;
}

export default function DashboardPage() {

  const params = useParams<{ fileId: string }>();
  const [parent, setParent] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pathsForBreadcrumb, setPathsForBreadcrumb] = useState<{ name: string }[]>([]);

useEffect(() => {
    if (params.fileId) {
      fetchParent();
    }
  }, [params.fileId]);

  useEffect(() => {
    if (parent) {
      const paths = parent.Ruta?.split('/').filter(item => item !== '').map((item, index) => {
        return {
          name: item
        }
      });
      setPathsForBreadcrumb(paths);
    }
  }, [parent]);

  const fetchParent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files/${params.fileId}`);
      if (!response.ok) {
        throw new Error('Error fetching parent data');
      }
      const res = await response.json();
      setParent(res.data);
    } catch (error) {
      console.error('Failed to fetch parent data:', error);
    } finally {
      setLoading(false);
    }
  }

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
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={'/documents?page=1'}>Mis documentos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {
                parent && pathsForBreadcrumb?.map((item, index) => {
                  // if (index === pathsForBreadcrumb.length - 1) {
                  return (
                    <Fragment key={index}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {item?.name}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </Fragment>
                  )
                  //} 
                })
              }
            </BreadcrumbList>
          </Breadcrumb>
        )
      }

      <FilesPage fileId={params.fileId} />
    </ContentLayout>
  );
}
