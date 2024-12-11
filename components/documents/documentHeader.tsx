
import { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderPlus, Upload } from 'lucide-react';
import React, { Fragment } from 'react'

interface DocumentHeaderProps {
    handleCreateFolder: () => void
}

export default function DocumentHeader({
    handleCreateFolder
} : DocumentHeaderProps) {
    return (
        <Fragment>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nuevo
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <Link href="/upload">
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
        </Fragment>
    )
}
