"use client";

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDocuments from './loading';
import Image from 'next/image';
import noDocuments from '@/public/no_documents.png';
import CreateFolderModal from './createFolderModal';
import { useContext } from 'react';
import { FolderContext } from '@/context/folder-context';
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
import ConfirmDeleteFile from '../modals/confirm-delete-file';
import SearchBar from '../custom-searchbar';
import MoveFileModal from '../modals/move-file-modal';
import { SearchResult } from '@/types/searchResult';
import { TextShimmer } from '../loading-text-effect';
import { X } from 'lucide-react';
import useAuthRoles from '@/hooks/useAuthRoles';

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
  const { folders, fetchFolders, loading, totalFolders, fetchChildren, childrenDocsAndFiles, loadingChildren, totalChildren } = useContext(FolderContext);
  const [openModalDelete, setOpenModalDelete] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAlreadySearched, setIsAlreadySearched] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  const { permissions } = useAuthRoles();

  const hasPermission = (resource: string, action: string) => {
    return permissions.some(
      (perm) => perm.rsname === resource && perm.scopes.includes(`scope:${action}`)
    );
  };

  // Limpiar el query de búsqueda
  useEffect(() => {
    if (query === '') {
      setResults([]);
      setIsAlreadySearched(false);
    }
    if (isSearching) {
      setIsAlreadySearched(false);
    }
  }, [query, isSearching]);


  useEffect(() => {
    if (currentPage < 1 || isNaN(currentPage)) {
      router.push('/pageNotFound');
      return;
    }

    if (parentId) {
      fetchChildren(parentId, currentPage, PAGE_SIZE);
    } else {
      // Fetch root folders
      fetchFolders(currentPage, PAGE_SIZE);
    }

  }, [currentPage, parentId]);

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
      setResults([]);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, parentId }),
      });

      if (!response.ok) {
        const body = await response.json();
        console.log('Error searching:', body);
        throw new Error('Error searching');
      }

      const { results } = await response.json();
      setResults(results);
      setIsAlreadySearched(true);
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
          <p className="text-2xl font-bold mb-4">Documentos</p>
          <GetBackButton />
        </CardTitle>

        <DocumentHeader
          handleCreateFolder={handleCreateFolder}
          canCreateFolder={hasPermission('res:folders', 'create')}
          canUploadDocument={hasPermission('res:documents', 'create')}
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
                            fieldValue={query}
                            setFieldValue={setQuery}
                            handleSearch={(query: string) => {
                              handleSearch(query, setResults, setIsSearching);
                              setQuery(query);
                            }}
                          />
                        </div>

                        {/* Resultado de la búsqueda */}

                        {
                          isSearching && (
                            <div className="flex justify-center mt-4 mb-8">
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
                            results.length > 0 && results.map((res, index) => (
                              <FileCard
                                showIcons={false}
                                canEditFile={hasPermission('res:documents', 'update')}
                                canDeleteFile={hasPermission('res:documents', 'delete')}
                                key={index}
                                orderId={index}
                                onClick={handleFileClick}
                                onDelete={handleDeleteFile}
                                onMove={handleMoveFile}
                                file={res}
                                creationDate={res.FechaCarga}
                                fileName={res.NombreArchivo}
                              />
                            ))
                          }
                        </div>
                        {
                          results.length === 0 && isAlreadySearched && (
                            <div className='text-center py-4 rounded-b-md'>
                              <X className='mx-auto h-8 w-8 text-gray-400' />
                              <h3 className='mt-2 text-sm font-semibold text-gray-900'>Sin resultados</h3>
                              <p className='mt-1 text-sm mx-auto max-w-prose text-gray-500'>
                                Lo sentimos, no pudimos encontrar resultados para
                                <span className='text-red-600 font-medium'>{query}</span>.
                              </p>
                            </div>
                          )
                        }


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {!isSearching && !isAlreadySearched && results.length == 0 && childrenDocsAndFiles.map((doc, index) =>
                            doc.Tipo === 'Archivo' ? (
                              <FileCard
                                canEditFile={hasPermission('res:documents', 'update')}
                                canDeleteFile={hasPermission('res:documents', 'delete')}
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
                                canEditFolder={hasPermission('res:folders', 'update')}
                                canDeleteFolder={hasPermission('res:folders', 'delete')}
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
                          fieldValue={query}
                          setFieldValue={setQuery}
                          handleSearch={(query: string) => {
                            handleSearch(query, setResults, setIsSearching);
                            setQuery(query);
                          }}
                        />
                      </div>

                      {
                        isSearching && (
                          <div className="flex justify-center mt-4 mb-8">
                            <TextShimmer
                              duration={1.2}
                              className='text-sm font-medium color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]'
                            >
                              Buscando documentos...
                            </TextShimmer>
                          </div>
                        )
                      }


                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.length > 0 && results.map((res, index) => (
                          <FileCard
                            showIcons={false}
                            canEditFile={hasPermission('res:documents', 'update')}
                            canDeleteFile={hasPermission('res:documents', 'delete')}
                            orderId={index}
                            key={index}
                            onClick={handleFileClick}
                            onDelete={handleDeleteFile}
                            onMove={handleMoveFile}
                            file={res}
                            creationDate={res.FechaCarga}
                            fileName={res.NombreArchivo}
                          />
                        ))
                        }
                      </div>
                      {
                        results.length === 0 && isAlreadySearched && (
                          <div className='text-center py-4 rounded-b-md'>
                            <X className='mx-auto h-8 w-8 text-gray-400' />
                            <h3 className='mt-2 text-sm font-semibold text-gray-900'>Sin resultados</h3>
                            <p className='mt-1 text-sm mx-auto max-w-prose text-gray-500'>
                              Lo sentimos, no pudimos encontrar resultados para {' '}
                              <span className='text-red-600 font-medium'>{query}</span>.
                            </p>
                          </div>
                        )
                      }


                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {!isSearching && !isAlreadySearched && results.length === 0 && folders.map((doc) => (

                          <FolderCard
                            canEditFolder={hasPermission('res:folders', 'update')}
                            canDeleteFolder={hasPermission('res:folders', 'delete')}
                            key={doc?.Id}
                            folder={doc}
                            fileName={doc?.Nombre}
                            creationDate={doc?.FechaCreacion}
                            onEdit={handleEditFolder}
                            onDelete={handleDeleteFolder}
                            onMove={handleMoveFolder}
                            onClick={handleFolderClick}
                          />

                        ))}
                      </div>
                      {
                        !isSearching && !isAlreadySearched && results.length === 0 && (
                          <div className='flex justify-center text-center mt-5'>
                            <PaginationWithLinks
                              page={currentPage}
                              pageSize={PAGE_SIZE}
                              totalCount={totalFolders}
                            />
                          </div>
                        )
                      }
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
          currentPage={currentPage}
        />

        <MoveFolderModal
          parentId={parentId}
          currentPage={currentPage}
          openModal={openMoveFolderModal}
          setOpenModal={setOpenMoveFolderModal}
          idFolder={idFolder}
        />

        <MoveFileModal
          currentPage={currentPage}
          openModal={openMoveFileModal}
          setOpenModal={setOpenMoveFileModal}
          idFile={idFile}
        />

        <ConfirmDeleteModal
          parentId={parentId}
          openModal={openDeleteModal}
          setOpenModal={setOpenDeleteModal}
          idFolder={idFolder}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
        />


        {/* Modal para confirmar eliminación de archivo */}
        <ConfirmDeleteFile
          parentId={parentId}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          openModal={openModalDelete}
          setOpenModal={setOpenModalDelete}
          fileId={idFile}
          persistSamePage={true}
        />
      </CardContent>
    </Card >
  );
}