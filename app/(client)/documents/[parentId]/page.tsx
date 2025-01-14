'use client';

import React from "react";
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
  const [pathsForBreadcrumb, setPathsForBreadcrumb] = useState<{ name: string }[]>([]);

  useEffect(() => {
    if (params.parentId) {
      fetchParent();
    }
  }, [params.parentId]);

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
      const response = await fetch(`/api/folders/${params.parentId}`);
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
                    <React.Fragment key={index}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {item?.name}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </React.Fragment>
                  )
                  //} 
                })
              }
            </BreadcrumbList>
          </Breadcrumb>
        )
      }

      <DocumentsPage parentId={params.parentId} />
    </ContentLayout>
  )
}