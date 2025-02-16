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
  const [parentList, setParentList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pathsForBreadcrumb, setPathsForBreadcrumb] = useState<{ id: number, name: string }[]>([]);

  useEffect(() => {
    if (params.parentId) {
      fetchAllParentFolders();
    }
  }, [params.parentId]);

  useEffect(() => {

    if (parentList) {
      const paths = parentList.map((item, index) => {
        return {
          name: item.Nombre,
          id: item.Id
        }
      })
      setPathsForBreadcrumb(paths.sort((a, b) => a.id - b.id));
    }

  }, [parentList]);

  const fetchAllParentFolders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/parentFolders/folderId/${params.parentId}`);
      if (!response.ok) {
        throw new Error('Error fetching parent folders');
      }
      const res = await response.json();
      setParentList(res.data);
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ContentLayout title="sinergIA">
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
                parentList && pathsForBreadcrumb?.map((item, index) => {
                  if (index === pathsForBreadcrumb.length - 1) {
                    return (
                      <React.Fragment key={index}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-primary font-bold">
                            {item?.name}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </React.Fragment>
                    )
                  } else {
                    return (
                      <React.Fragment key={index}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href={`/documents/${item.id}?page=1`}>
                              {item?.name}
                            </Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </React.Fragment>
                    )
                  }
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