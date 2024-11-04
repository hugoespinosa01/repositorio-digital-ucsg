'use client';

import { createContext } from 'react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const ChildrenContext = createContext<{
    childrenDocsAndFiles: any[];
    fetchChildren: (parentId: string | null, currentPage: number, pageSize: number) => Promise<void>;
    loadingChildren: boolean;
    totalChildren: number;
}>({
    childrenDocsAndFiles: [],
    fetchChildren: async () => { },
    loadingChildren: false,
    totalChildren: 0
});

export const ChildrenProvider = ({ children }: { children: React.ReactNode }) => {

    const [childrenDocsAndFiles, setChildrenDocsAndFiles] = useState<any[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [totalChildren, setTotalChildren] = useState<number>(0);
    const { toast } = useToast();


    async function fetchChildren(parentId: string | null, currentPage: number, pageSize: number) {
        try {
            setLoadingChildren(true);
            const response = await fetch(`/api/folders/${Number(parentId)}/children?page=${currentPage}&page_size=${pageSize}`);
            if (response.ok){
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



    return (
        <ChildrenContext.Provider value={{
            childrenDocsAndFiles,
            fetchChildren,
            loadingChildren,
            totalChildren
        }}>
            {children}
        </ChildrenContext.Provider>
    )
}