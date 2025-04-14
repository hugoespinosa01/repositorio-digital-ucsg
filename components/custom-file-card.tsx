import React, { useEffect } from 'react';
import { File, Trash2, FolderInput } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import useAuthRoles  from '@/hooks/useAuthRoles';

interface FileCardProps {
  fileName: string;
  creationDate: string;
  file: any;
  onDelete?: (id: number) => void;
  onClick?: (id: number) => void;
  onMove?: (id: number) => void;
  orderId?: number;
  canEditFile: boolean;
  canDeleteFile: boolean;
  showIcons?: boolean;
}

export function FileCard({ 
    fileName,
    creationDate,
    file,
    onDelete,
    onClick,
    onMove,
    orderId,
    canEditFile,
    canDeleteFile,
    showIcons
  }: FileCardProps) {
  const [showActions, setShowActions] = React.useState(false);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="relative group rounded-lg p-4 border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer w-full"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick && onClick(file?.Id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
            <File className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0 group">
            <h3 className={cn(orderId === 0 && "bg-yellow-500", "font-medium group-hover:text-primary transition-all duration-300 truncate group-hover:max-w-[80%]")}>
              {fileName}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              Subido el: {new Date(creationDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Status: {file?.StatusValidacion}
            </p>
          </div>

        </div>

        <div className={`relative ml-2 shrink-0 ${ showIcons == false ? 'invisible' : showActions ? 'visible' : 'invisible group-hover:visible'}`}>
          <div className="absolute right-0 top-0 flex items-center space-x-1">

            {
              canDeleteFile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => onDelete && handleActionClick(e, () => onDelete(file?.Id))}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Eliminar
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>)
            }

            {
              canEditFile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => onMove && handleActionClick(e, () => onMove(file?.Id))}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <FolderInput className="w-4 h-4 text-gray-600 hover:text-yellow-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Mover
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>)
            }
          </div>
        </div>
      </div>
    </div>
  );
}