"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import LoadingDocuments from '@/components/documents/loading';
import Image from 'next/image';
import noDocuments from '@/img/no_documents.png';
import { useContext } from 'react';
import { FolderContext } from '@/context/folder-context';
import { ChildrenContext } from '@/context/children-context';
import { FolderCard } from '@/components/custom-folder-card';
import { Folder } from '@/types/folder';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { PaginationWithLinks } from '@/components/custom-pagination';
import GetBackButton from '../getback-button';
import { FileCard } from '../custom-file-card';
import { AuthContext } from '@/context/auth-context';

const PAGE_SIZE = 6;

export default function FilesPage({ parentId }: { parentId?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page'));
  const [openModal, setOpenModal] = useState(false);
  const [openMoveModal, setOpenMoveModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [idFolder, setIdFolder] = useState<number>(0);
  const [editMode, setEditMode] = useState(false);
  const { folders, fetchFolders, loading, totalFolders } = useContext(FolderContext);
  const { fetchChildren, childrenDocsAndFiles, loadingChildren, totalChildren } = useContext(ChildrenContext);
  
  //Para autenticación
  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    // if (currentPage < 1 || isNaN(currentPage)) {
    //   router.push('/pageNotFound');
    //   return;
    //}
    if (parentId && keycloak) {
      if (keycloak.token) {
        //fetchChildren(parentId, currentPage, PAGE_SIZE, keycloak?.token);
      }
    } else {
      // Fetch root folders
      if (keycloak) {
        if (keycloak.token) {
          //fetchFolders(currentPage, PAGE_SIZE, keycloak?.token);
        }
      }
    }

  }, [currentPage]);

  const handleCreateFolder = () => {
    setEditMode(false);
    setOpenModal(true);
  }

  const handleEditFolder = (folder: Folder) => {
    setEditMode(true);
    setOpenModal(true);
    setFolder(folder);
  }

  const handleDeleteFolder = (id: number) => {
    setIdFolder(id);
    setOpenDeleteModal(true);
  }

  const handleMoveFolder = (id: number) => {
    setIdFolder(id);
    setOpenMoveModal(true);
  }

  const handleFolderClick = (id: number) => {
    router.push(`/documents/${id}?page=1`);
  }

  const handleFileClick = (id: number) => {
    console.log('File clicked', id);
    router.push(`/files/${id}?page=1`);
  }

  return (
    <Card className='p-5 mt-5'>

      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">Archivo detalle</h1>
          <GetBackButton />
        </CardTitle>       
      </CardHeader>
    
      <CardContent>
        {(loading || loadingChildren) ? (
          <div className="container mx-auto p-4">
            <LoadingDocuments />
          </div>
        ) :
          (
            <div className="container mx-auto p-4">
                <strong>Estudiante: </strong>
                <p>Hugo Espinosa</p>
            </div>
          )}
      </CardContent>
    </Card >
  );
}