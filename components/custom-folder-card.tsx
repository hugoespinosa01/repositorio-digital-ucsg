import React from 'react';
import { FolderArchive, FolderInput, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Folder } from '@/types/folder';

interface FileCardProps {
    folder: Folder;
    fileName: string;
    creationDate: string;
    onEdit?: (folder: Folder) => void;
    onDelete?: (id: number) => void;
    onClick?: (id: number) => void;
    onMove?: (id: number) => void;
}

export function FolderCard({ folder, fileName, creationDate, onEdit, onDelete, onMove, onClick }: FileCardProps) {
    const [showActions, setShowActions] = React.useState(false);

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            className="relative group rounded-lg p-4 border border-gray-200 hover:border-yellow-700 hover:shadow-lg transition-all duration-200 cursor-pointer w-full"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onClick={() => onClick?.(folder.Id)}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <FolderOpen className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-medium group-hover:text-yellow-700 transition-colors truncate">
                            {fileName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">Creado el: {new Date(creationDate).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className={`relative ml-2 shrink-0 ${showActions ? 'visible' : 'invisible group-hover:visible'}`}>
                    <div className="absolute right-0 top-0 flex items-center space-x-1">

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => onEdit && handleActionClick(e, () => onEdit(folder))}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-600 hover:text-yellow-600" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Editar
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => onDelete && handleActionClick(e, () => onDelete(folder.Id))}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Eliminar
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => onMove && handleActionClick(e, () => onMove(folder.Id))}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <FolderInput className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Mover
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>



                    </div>
                </div>
            </div>
        </div>
    );
}