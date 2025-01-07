
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderPlus, Upload } from 'lucide-react';
import React from 'react'

interface DocumentHeaderProps {
    handleCreateFolder: () => void;
    canCreateFolder: boolean;
    canUploadDocument: boolean;
}

export default function DocumentHeader({
    handleCreateFolder,
    canCreateFolder,
    canUploadDocument
}: DocumentHeaderProps) {

    return (
            <DropdownMenu aria-hidden="false">
                <DropdownMenuTrigger asChild aria-hidden="false">
                    <Button className="gap-2" size={'sm'}>
                        <Plus size={15} />
                        Nuevo
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" aria-hidden="false">
                    {
                        canUploadDocument && (
                            <Link href="/upload">
                                <DropdownMenuItem className="gap-2 cursor-pointer" aria-hidden="false">
                                    <Upload className="h-4 w-4" />
                                    Subir archivo
                                </DropdownMenuItem>
                            </Link>
                        )
                    }
                    {
                        canCreateFolder && (
                            <DropdownMenuItem aria-hidden="false" className="gap-2 cursor-pointer" onClick={handleCreateFolder}>
                                <FolderPlus className="h-4 w-4" />
                                Crear carpeta
                            </DropdownMenuItem>
                        )
                    }
                </DropdownMenuContent>
            </DropdownMenu>
    )
}
