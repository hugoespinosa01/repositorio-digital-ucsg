
import { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderPlus, Upload } from 'lucide-react';
import React, { Fragment } from 'react'
import useAuthRoles from '@/hooks/useAuthRoles';

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
        <Fragment>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="gap-2" size={'sm'}>
                        <Plus size={15} />
                        Nuevo
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {
                        canUploadDocument && (
                            <Link href="/upload">
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                    <Upload className="h-4 w-4" />
                                    Subir archivo
                                </DropdownMenuItem>
                            </Link>
                        )
                    }
                    {
                        canCreateFolder && (
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleCreateFolder}>
                                <FolderPlus className="h-4 w-4" />
                                Crear carpeta
                            </DropdownMenuItem>
                        )
                    }
                </DropdownMenuContent>
            </DropdownMenu>
        </Fragment>
    )
}
