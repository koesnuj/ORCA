import React, { useState } from 'react';
import { FolderTreeItem } from '../api/folder';
import { ChevronRight, ChevronDown, Folder as FolderIcon, Plus, Layers } from 'lucide-react';

interface FolderTreeProps {
  folders: FolderTreeItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAddFolder: (parentId: string | null) => void;
}

const FolderItem: React.FC<{
  folder: FolderTreeItem;
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onAddFolder: (parentId: string | null) => void;
  depth: number;
}> = ({ folder, selectedFolderId, onSelectFolder, onAddFolder, depth }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = folder.id === selectedFolderId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-0.5">
      <div
        className={`flex items-center py-1.5 px-2 cursor-pointer rounded-md text-sm transition-colors group ${
          isSelected 
            ? 'bg-white border border-indigo-200 shadow-sm text-indigo-700 font-medium' 
            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        <div onClick={handleToggle} className={`mr-1 ${isSelected ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-500'}`}>
          {folder.children && folder.children.length > 0 ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-3.5" />
          )}
        </div>
        <FolderIcon size={16} className={`mr-2 ${isSelected ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
        <span className="flex-1 truncate select-none">{folder.name}</span>
        <button
          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onAddFolder(folder.id);
          }}
        >
          <Plus size={14} />
        </button>
      </div>
      
      {isOpen && folder.children && (
        <div className="mt-0.5">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onAddFolder={onAddFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
}) => {
  return (
    <div className="h-full">
      <div className="py-2">
        {/* All Cases Item */}
        <div
          className={`flex items-center py-1.5 px-2 mb-1 cursor-pointer rounded-md text-sm transition-colors ${
            selectedFolderId === null
              ? 'bg-white border border-indigo-200 shadow-sm text-indigo-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100 border border-transparent'
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <div className="w-3.5 mr-1" />
          <Layers size={16} className={`mr-2 ${selectedFolderId === null ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span className="flex-1 truncate select-none">All Cases</span>
        </div>

        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onAddFolder={onAddFolder}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
};

