import React from 'react';
import { File, Pencil, Trash2 } from 'lucide-react';

interface FileCardProps {
  fileName: string;
  creationDate: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function FileCard({ fileName, creationDate, onEdit, onDelete, onClick }: FileCardProps) {
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
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
            <File className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium group-hover:text-primary transition-colors truncate">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500 truncate">Subido el: {new Date(creationDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className={`relative ml-2 shrink-0 ${showActions ? 'visible' : 'invisible group-hover:visible'}`}>
          <div className="absolute right-0 top-0 flex items-center space-x-1">
            <button
              onClick={(e) => onEdit && handleActionClick(e, onEdit)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4 text-gray-600 hover:text-blue-600" />
            </button>
            <button
              onClick={(e) => onDelete && handleActionClick(e, onDelete)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}