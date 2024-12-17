"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from './loading';
import Image from 'next/image';
import noDocuments from '@/img/no_documents.png';
import CreateFolderModal from './createFolderModal';
import { useContext } from 'react';
import { FolderContext } from '@/context/folder-context';
import { ChildrenContext } from '@/context/children-context';
import { FolderCard } from '@/components/custom-folder-card';
import { Folder } from '@/types/folder';
import MoveFolderModal from './moveFolderModal';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { PaginationWithLinks } from '@/components/custom-pagination';
import DocumentHeader from './documentHeader';
import GetBackButton from '../getback-button';
import ConfirmDeleteModal from './confirmDeleteModal';
import { FileCard } from '../custom-file-card';
import { AuthContext } from '@/context/auth-context';
import ConfirmDeleteFile from '../modals/confirm-delete-file';
import SearchBar from '../custom-searchbar';
import MoveFileModal from '../modals/move-file-modal';

const PAGE_SIZE = 6;

export default function DocumentsPage({ parentId }: { parentId?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page'));
  const [openModal, setOpenModal] = useState(false);
  const [openMoveFolderModal, setOpenMoveFolderModal] = useState<boolean>(false);
  const [openMoveFileModal, setOpenMoveFileModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [idFolder, setIdFolder] = useState<number>(0);
  const [idFile, setIdFile] = useState<number>(0);
  const [editMode, setEditMode] = useState(false);
  const { folders, fetchFolders, loading, totalFolders } = useContext(FolderContext);
  const [openModalDelete, setOpenModalDelete] = useState<boolean>(false);
  const { fetchChildren, childrenDocsAndFiles, loadingChildren, totalChildren } = useContext(ChildrenContext);


  //Para autenticación
  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    if (currentPage < 1 || isNaN(currentPage)) {
      router.push('/pageNotFound');
      return;
    }
    if (parentId) {
      //if (parentId && keycloak) {
      //if (keycloak.token) {
      fetchChildren(parentId, currentPage, PAGE_SIZE, '');
      // }
    } else {
      // Fetch root folders
      //if (keycloak) {
      //if (keycloak.token) {
      fetchFolders(currentPage, PAGE_SIZE, '');
      //}
      // }
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
    setOpenMoveFolderModal(true);
  }

  const handleMoveFile = (id: number) => {
    console.log('Move file', id);
    setIdFile(id);
    setOpenMoveFileModal(true);
  }

  const handleFolderClick = (id: number) => {
    router.push(`/documents/${id}?page=1`);
  }

  const handleFileClick = (id: number) => {
    console.log('File clicked', id);
    router.push(`/files/${id}`);
  }

  const handleDeleteFile = (id: number) => {
    setOpenModalDelete(true);
    setIdFile(id);
  }

  return (
    <Card className='p-5 mt-5'>
      <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>

        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">Documentos</h1>
          <GetBackButton />
        </CardTitle>
        <DocumentHeader
          handleCreateFolder={handleCreateFolder}
        />

      </CardHeader>
      <CardContent>
        {(loading || loadingChildren) ? (
          <div className="container mx-auto p-4">
            <LoadingDocuments />
          </div>
        ) :
          (
            <div className="container mx-auto p-4">

              {
                parentId ?

                  childrenDocsAndFiles.length > 0 ?

                    (
                      <>
                        {/* Barra de búsqueda */}
                        <div className="justify-center mb-8 text-center">
                          <SearchBar />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {childrenDocsAndFiles.map((doc) =>
                            doc.Tipo === 'Archivo' ? (
                              <FileCard
                                onClick={handleFileClick}
                                onDelete={handleDeleteFile}
                                onMove={handleMoveFile}
                                key={doc.Id}
                                file={doc}
                                creationDate={doc.FechaCarga}
                                fileName={doc.NombreArchivo}
                              />
                            ) : (
                              <FolderCard
                                key={doc.Id}
                                folder={doc}
                                fileName={doc.Nombre}
                                creationDate={doc.FechaCreacion}
                                onEdit={handleEditFolder}
                                onDelete={handleDeleteFolder}
                                onMove={handleMoveFolder}
                                onClick={handleFolderClick}
                              />
                            )
                          )}

                        </div>
                        <div className='flex justify-center text-center mt-5'>
                          <PaginationWithLinks
                            page={currentPage}
                            pageSize={PAGE_SIZE}
                            totalCount={totalChildren}
                          />
                        </div>
                      </>
                    ) : (
                      <div className='flex flex-col items-center justify-center'>
                        <Image src={noDocuments} alt="No hay documentos" width={500} height={500} />
                        <p className='text-2xl'>No se encontraron documentos</p>
                      </div>
                    ) :
                  folders.length > 0 ? (
                    <>
                      {/* Barra de búsqueda */}
                      <div className="justify-center mb-8 text-center">
                        <SearchBar />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {folders.map((doc) => (

                          <FolderCard
                            key={doc.Id}
                            folder={doc}
                            fileName={doc.Nombre}
                            creationDate={doc.FechaCreacion}
                            onEdit={handleEditFolder}
                            onDelete={handleDeleteFolder}
                            onMove={handleMoveFolder}
                            onClick={handleFolderClick}
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
                    </>
                  ) : (

                    <div className='flex flex-col items-center justify-center'>
                      <Image src={noDocuments} alt="No hay documentos" width={500} height={500} />
                      <p className='text-2xl'>No se encontraron documentos</p>
                    </div>
                  )}

            </div>
          )}
        {/* Ventanas modales */}

        <CreateFolderModal
          openModal={openModal}
          setOpenModal={setOpenModal}
          editMode={editMode}
          folder={folder}
          parentId={parentId}
        />

        <MoveFolderModal
          openModal={openMoveFolderModal}
          setOpenModal={setOpenMoveFolderModal}
          idFolder={idFolder}
        />

        <MoveFileModal
          openModal={openMoveFileModal}
          setOpenModal={setOpenMoveFileModal}
          idFile={idFile}
        />

        <ConfirmDeleteModal
          openModal={openDeleteModal}
          setOpenModal={setOpenDeleteModal}
          idFolder={idFolder}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
        />


        {/* Modal para confirmar eliminación de archivo */}
        <ConfirmDeleteFile
          openModal={openModalDelete}
          setOpenModal={setOpenModalDelete}
          idFile={idFile}
          persistSamePage={true}
        />
      </CardContent>
    </Card >
  );
}