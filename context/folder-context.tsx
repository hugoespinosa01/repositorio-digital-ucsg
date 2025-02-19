'use client';
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from '@/components/ui/use-toast';
import { Folder } from "@/types/folder";

export const FolderContext = createContext<{
    folders: any[];
    fetchFolders: (currentPage: number, pageSize: number) => Promise<void>;
    loading: boolean;
    createFolder: (nombre: string, setOpenModal: (open: boolean) => void, parentId: number, currentPage: number) => Promise<void>;
    updateFolder: (id: number, nombre: string, setOpenModal: (open: boolean) => void, parentId: number, currentPage: number) => Promise<void>;
    deleteFolder: (id: number, currentPage: number, pageSize: number, parentId: number) => Promise<void>;
    moveFolder: (id: number | undefined, newId: number | null, setOpenModal: (open: boolean) => void, pageSize: number, currentPage: number, parentId: number | undefined) => Promise<void>;
    isSubmitting: boolean;
    totalFolders: number;
    pageSize: number;
    childrenDocsAndFiles: any[];
    fetchChildren: (parentId: string | null, currentPage: number, pageSize: number) => Promise<void>;
    loadingChildren: boolean;
    totalChildren: number;
}>({
    folders: [],
    fetchFolders: async () => { },
    loading: false,
    createFolder: async () => { },
    updateFolder: async () => { },
    deleteFolder: async () => { },
    moveFolder: async () => { },
    isSubmitting: false,
    totalFolders: 0,
    pageSize: 6,
    childrenDocsAndFiles: [],
    fetchChildren: async () => { },
    loadingChildren: false,
    totalChildren: 0
});

export const FolderProvider = ({ children }: { children: React.ReactNode }) => {

    const [folders, setFolders] = useState<Folder[]>([]);
    const [totalFolders, setTotalFolders] = useState<number>(0);
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pageSize, setPageSize] = useState(6);
    const [childrenDocsAndFiles, setChildrenDocsAndFiles] = useState<any[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [totalChildren, setTotalChildren] = useState<number>(0);

    async function fetchFolders(currentPage: number, pageSize: number) {
        try {
            setLoading(true);
            setPageSize(pageSize);

            const response = await fetch(`/api/folders?page=${currentPage}&page_size=${pageSize}`);
            if (response.ok) {
                const res = await response.json();

                if (Array.isArray(res.data)) {
                    setFolders(res.data);
                    setTotalFolders(res.length);
                } else {
                    console.error('Unexpected response format:', res);
                    throw new Error('Formato de respuesta inesperado');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al obtener los documentos');
            }
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los documentos. Por favor, intenta de nuevo más tarde.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function createFolder(nombre: string, setOpenModal: (open: boolean) => void, parentId: number, currentPage: number) {
        try {

            setIsSubmitting(true);

            const body = {
                Nombre: nombre,
                IdCarpetaPadre: parentId ?? null,
            }

            const response = await fetch("/api/folders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al crear la carpeta");
            }

            toast({
                title: "Carpeta creada",
                description: "La carpeta ha sido creada exitosamente",
                variant: "default",
            });

            if (parentId) {
                fetchChildren(parentId.toString(), currentPage, pageSize);
            } else {
                fetchFolders(currentPage, pageSize);
            }


        } catch (error) {
            console.error("Error en el envío del formulario:", error);
            toast({
                title: "Error",
                description: "Error al crear la carpeta",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setOpenModal(false);
        }
    }

    async function fetchChildren(parentId: string | null, currentPage: number, pageSize: number) {
        try {
            setLoadingChildren(true);

            const response = await fetch(`/api/folders/${Number(parentId)}/children?page=${currentPage}&page_size=${pageSize}`);
            if (response.ok) {
                const res = await response.json();
                if (Array.isArray(res.data)) {
                    setChildrenDocsAndFiles(res.data);
                    setTotalChildren(res.length);
                } else {
                    console.error('Unexpected response format:', res);
                    throw new Error('Unexpected response format');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error fetching folders');
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los documentos. Por favor, intenta de nuevo más tarde.",
                variant: "destructive",
            });
        } finally {
            setLoadingChildren(false);
        }
    }

    async function updateFolder(id: number, nombre: string, setOpenModal: (open: boolean) => void, parentId: number, currentPage: number) {
        try {

            setIsSubmitting(true);

            const body = {
                Nombre: nombre,
                IdCarpetaPadre: parentId,
            }

            const response = await fetch(`/api/folders/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar la carpeta");
            }

            toast({
                title: "Carpeta actualizada",
                description: "La carpeta ha sido actualizada exitosamente",
                variant: "default",
            });

            if (parentId) {
                fetchChildren(parentId.toString(), currentPage, pageSize);
            } else {
                fetchFolders(currentPage, pageSize);
            }

        } catch (error) {
            console.error("Error en el envío del formulario:", error);
            toast({
                title: "Error",
                description: "Error al actualizar la carpeta",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setOpenModal(false);
        }
    }

    async function deleteFolder(id: number, currentPage: number, pageSize: number, parentId: number) {
        try {
            setLoading(true);
            const response = await fetch(`/api/folders/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                if (parentId) {
                    fetchChildren(parentId.toString(), currentPage, pageSize);
                } else {
                    fetchFolders(currentPage, pageSize);
                }
            } else {
                const errorData = await response.json();
                toast({
                    title: "Error",
                    description: errorData.error || "Error al eliminar la carpeta",
                    variant: "destructive",
                })
            }

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Error al eliminar la carpeta",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function moveFolder(id: number | undefined, newId: number | null, setOpenModal: (open: boolean) => void, pageSize: number, currentPage: number, parentId: number | undefined) {
        try {

            if (!id) {
                throw new Error("No se ha especificado la carpeta a mover");
            }

            setIsSubmitting(true);

            const response = await fetch(`/api/folders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ IdCarpetaPadre: newId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al mover la carpeta");
            } 

            toast({
                title: "Carpeta movida",
                description: "La carpeta ha sido movida exitosamente",
                variant: "default",
            });

            if (parentId) {
                fetchChildren(parentId.toString(), currentPage, pageSize);
            } else {
                fetchFolders(currentPage, pageSize);
            }

        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "Error al mover la carpeta",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setOpenModal(false);
        }
    }

    return (
        <FolderContext.Provider value={{
            folders,
            fetchFolders,
            loading,
            createFolder,
            isSubmitting,
            updateFolder,
            deleteFolder,
            moveFolder,
            totalFolders,
            pageSize,
            childrenDocsAndFiles,
            fetchChildren,
            loadingChildren,
            totalChildren
        }}>
            {children}
        </FolderContext.Provider>
    )
}