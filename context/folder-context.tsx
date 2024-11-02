'use client';
import React, { createContext, useState } from "react";
import { useToast } from '@/components/ui/use-toast';
import { Folder } from "@/types/folder";

export const FolderContext = createContext<{
    folders: any[];
    fetchFolders: () => Promise<void>;
    loading: boolean;
    createFolder: (nombre: string, setOpenModal: (open: boolean) => void) => Promise<void>;
    updateFolder: (id: number, nombre: string, setOpenModal: (open: boolean) => void) => Promise<void>;
    deleteFolder: (id: number) => Promise<void>;
    isSubmitting: boolean;
}>({
    folders: [],
    fetchFolders: async () => { },
    loading: false,
    createFolder: async () => { },
    updateFolder: async () => { },
    deleteFolder: async () => { },
    isSubmitting: false,
});

export const FolderProvider = ({ children }: { children: React.ReactNode }) => {

    const [folders, setFolders] = useState<Folder[]>([]);
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function fetchFolders() {
        setLoading(true);
        try {
            const response = await fetch('/api/documents');
            if (response.ok) {
                const res = await response.json();

                if (Array.isArray(res.data)) {
                    setFolders(res.data);
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

    async function createFolder(nombre: string, setOpenModal: (open: boolean) => void) {
        try {

            setIsSubmitting(true);

            const body = {
                Nombre: nombre,
            }

            const response = await fetch("/api/documents", {
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

            setFolders([...folders, data.data]);
            setOpenModal(false);

        } catch (error) {
            console.error("Error en el envío del formulario:", error);
            toast({
                title: "Error",
                description: "Error al crear la carpeta",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function updateFolder(id: number, nombre: string, setOpenModal: (open: boolean) => void) {
        try {

            setIsSubmitting(true);

            const body = {
                Nombre: nombre,
            }

            const response = await fetch(`/api/documents/${id}`, {
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

            const updatedFolders = folders.map(folder => {
                if (folder.Id === id) {
                    return data.data;
                }
                return folder;
            });

            setFolders(updatedFolders);
            setOpenModal(false);

        } catch (error) {
            console.error("Error en el envío del formulario:", error);
            toast({
                title: "Error",
                description: "Error al actualizar la carpeta",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function deleteFolder(id: number) {
        try {
            setLoading(true);
            const response = await fetch(`/api/documents/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchFolders();
            }
            toast({
                title: "Carpeta eliminada",
                description: "La carpeta ha sido eliminada exitosamente",
                variant: "default",
            })
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Error al eliminar la carpeta",
                variant: "destructive",
            });
        }
    }

    return (
        <FolderContext.Provider value={{ folders, fetchFolders, loading, createFolder, isSubmitting, updateFolder, deleteFolder }}>
            {children}
        </FolderContext.Provider>
    )
}