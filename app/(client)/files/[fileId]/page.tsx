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
import { Folder } from "@/types/folder";
import { useRef } from "react";
import { EllipsisBreadcrumb } from "@/constants";

export default function DashboardPage() {

  const params = useParams<{ fileId: string }>();
  const [parentList, setParentList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pathsForBreadcrumb, setPathsForBreadcrumb] = useState<{ id: number, name: string }[]>([]);
  const breadcrumbRef = useRef<HTMLOListElement>(null);


  useEffect(() => {
    if (params.fileId) {
      fetchAllParentFolders();
    }
  }, [params.fileId]);

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

  useEffect(() => {
    if (breadcrumbRef.current) {
      const breadcrumbWidth = breadcrumbRef.current.offsetWidth;
      const containerWidth = breadcrumbRef.current.parentElement?.offsetWidth || 0;

      if (breadcrumbWidth > containerWidth) {
        const visibleItems = Math.floor(containerWidth / (breadcrumbWidth / pathsForBreadcrumb.length));
        const startItems = Math.ceil(visibleItems / 2);
        const endItems = Math.floor(visibleItems / 2);

        const newPaths = [
          ...pathsForBreadcrumb.slice(0, startItems),
          { id: -1, name: '...' },
          ...pathsForBreadcrumb.slice(pathsForBreadcrumb.length - endItems)
        ];
        setPathsForBreadcrumb(newPaths);
      }
    }
  }, [pathsForBreadcrumb]);


  const fetchAllParentFolders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/parentFolders/fileId/${params.fileId}`);
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
            <BreadcrumbList ref={breadcrumbRef}>
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
                  if (item.name === '...') {
                    return <EllipsisBreadcrumb key={index} />
                  } else if (index === pathsForBreadcrumb.length - 1) {
                    return (
                      <Fragment key={index}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-primary font-bold">
                            {item?.name}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </Fragment>
                    )
                  } else {
                    return (
                      <Fragment key={index}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href={`/documents/${item.id}?page=1`}>
                              {item?.name}
                            </Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </Fragment>
                    )
                  }
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
