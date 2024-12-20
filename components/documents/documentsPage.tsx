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
import { SearchResult } from '@/types/searchResult';
import { TextShimmer } from '../loading-text-effect';

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
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
    router.push(`/files/${id}`);
  }

  const handleDeleteFile = (id: number) => {
    setOpenModalDelete(true);
    setIdFile(id);
  }

  const handleSearch = async (
    query: string,
    setResults: (results: SearchResult[]) => void,
    setIsSearching: (isSearching: boolean) => void
  ) => {
    try {
      setIsSearching(true);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': keycloak?.token ? `Bearer ${keycloak.token}` : '',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const body = await response.json();
        console.log('Error searching:', body);
        throw new Error('Error searching');
      }

      const { results } = await response.json();
      setResults(results);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
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
                          <SearchBar
                            handleSearch={(query: string) => {
                              handleSearch(query, setResults, setIsSearching);
                              setQuery(query);
                            }}

                          />
                        </div>

                        {
                          isSearching && (
                            <div className="flex justify-center mb-8">
                              <div className="flex items-center space-x-3 bg-white p-3 rounded-sm">
                                <p className="text-sm text-gray-600">Buscando documentos...</p>
                                <div className="spinner-border-3 border-t-transparent border-red-800 rounded-full w-4 h-4 animate-spin"></div>
                              </div>

                              <TextShimmer
                                duration={1.2}
                                className='text-sm font-medium color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]'
                              >
                                Buscando documentos...
                              </TextShimmer>

                            </div>
                          )
                        }

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {
                            results.map((res, index) => (
                              <FileCard
                                key={index}
                                onClick={handleFileClick}
                                onDelete={handleDeleteFile}
                                onMove={handleMoveFile}
                                file={res.metadata}
                                creationDate={res.metadata.FechaCarga}
                                fileName={res.metadata.NombreArchivo}
                              />
                            ))
                          }
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {!isSearching && childrenDocsAndFiles.map((doc, index) =>
                            doc.Tipo === 'Archivo' ? (
                              <FileCard
                                onClick={handleFileClick}
                                onDelete={handleDeleteFile}
                                onMove={handleMoveFile}
                                key={index}
                                file={doc}
                                creationDate={doc.FechaCarga}
                                fileName={doc.NombreArchivo}
                              />
                            ) : (
                              <FolderCard
                                key={index}
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
                        <SearchBar
                          handleSearch={(query: string) => {
                            handleSearch(query, setResults, setIsSearching);
                            setQuery(query);
                          }}
                        />
                      </div>

                      {
                        isSearching && (
                          <div className="flex justify-center mb-8">
                            <div className="flex items-center space-x-3 bg-white p-3 rounded-sm">
                              <p className="text-sm text-gray-600">Buscando documentos...</p>
                              <div className="spinner-border-3 border-t-transparent border-red-800 rounded-full w-4 h-4 animate-spin"></div>
                            </div>
                          </div>
                        )
                      }

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {!isSearching && folders.map((doc) => (

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