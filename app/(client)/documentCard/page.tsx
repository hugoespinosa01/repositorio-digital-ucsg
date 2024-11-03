"use client";

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import LoadingDocuments from './loading';
import Image from 'next/image';
import noDocuments from '../../../img/no_documents.png';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderPlus, Upload } from 'lucide-react';
import CreateFolderModal from './createFolderModal';
import { useContext } from 'react';
import { FolderContext } from '@/context/folder-context';
import { FolderCard } from '@/components/custom-folder-card';
import { Folder } from '@/types/folder';
import MoveFolderModal from './moveFolderModal';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { PaginationWithLinks } from '@/components/custom-pagination';

const PAGE_SIZE = 6;

export default function DocumentsPage({ documentId } : { documentId?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page'));
  const [openModal, setOpenModal] = useState(false);
  const [openMoveModal, setOpenMoveModal] = useState(false);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [idFolder, setIdFolder] = useState<number>(0);
  const [editMode, setEditMode] = useState(false);
  const { folders, fetchFolders, deleteFolder, loading, totalFolders} = useContext(FolderContext);
  
 
  useEffect(() => {
    fetchFolders(currentPage, PAGE_SIZE);
    if (documentId) {
      router.push(`/documents?page=2`);
    }
    if ( currentPage < 1 ) {
      router.push('/documents?page=1');
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
    deleteFolder(id, currentPage, PAGE_SIZE);
  }

  const handleMoveFolder = (id: number) => {
    setOpenMoveModal(true);
    setIdFolder(id);
  }

  const handleClick = (id: number) => {
    router.push(`/documents/${id}`);
  }

  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle> <h1 className="text-2xl font-bold mb-4">Documentos</h1>
        </CardTitle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <Link href="/subirDocumento">
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                Subir documento
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4" />
              Crear carpeta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateFolderModal openModal={openModal} setOpenModal={setOpenModal} editMode={editMode} folder={folder} />

        <MoveFolderModal openModal={openMoveModal} setOpenModal={setOpenMoveModal} idFolder={idFolder} />

      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="container mx-auto p-4">
            <LoadingDocuments />
          </div>
        ) : (
          <div className="container mx-auto p-4">
            {folders.length > 0 ? (
              <Fragment>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((doc) => (

                    <FolderCard
                      key={doc.Id}
                      folder={doc}
                      fileName={doc.Nombre}
                      creationDate={doc.FechaCreacion}
                      onEdit={handleEditFolder}
                      onDelete={handleDeleteFolder}
                      onMove={handleMoveFolder}
                      onClick={handleClick}
                    />

                  ))}

                </div>
                <div className='flex justify-center text-center mt-5'>  
                  <PaginationWithLinks
                    page={currentPage}
                    pageSize={PAGE_SIZE}
                    totalCount={totalFolders}
                  />
                </div>
              </Fragment>

            ) : (
              <div className='flex flex-col items-center justify-center'>
                <Image src={noDocuments} alt="No hay documentos" width={500} height={500} />
                <p className='text-2xl'>No se encontraron documentos</p>
              </div>
            )}
          </div>
        )}

      </CardContent>

    </Card >
  );
}