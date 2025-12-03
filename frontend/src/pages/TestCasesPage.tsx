import React, { useState, useEffect, useMemo } from 'react';
import { FolderTree } from '../components/FolderTree';
import { CsvImportModal } from '../components/CsvImportModal';
import { TestCaseFormModal } from '../components/TestCaseFormModal';
import { getFolderTree, createFolder, renameFolder, FolderTreeItem } from '../api/folder';
import { getTestCases, TestCase, deleteTestCase, reorderTestCases, bulkUpdateTestCases, bulkDeleteTestCases, moveTestCasesToFolder } from '../api/testcase';
import { Plus, Upload, FileText, MoreHorizontal, Edit, Trash2, GripVertical, CheckSquare, Square, X, FolderInput, Layers, Folder as FolderIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { InputModal } from '../components/ui/InputModal';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// HTML 태그를 제거하고 텍스트만 추출하는 헬퍼 함수
const stripHtmlTags = (html: string | null | undefined): string => {
  if (!html) return '';
  // DOM Parser를 사용하여 HTML을 파싱하고 텍스트만 추출
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Bulk Edit Modal Component
interface BulkEditModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onApply: (priority: 'LOW' | 'MEDIUM' | 'HIGH') => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, selectedCount, onClose, onApply }) => {
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">일괄 수정</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          선택된 <span className="font-semibold text-indigo-600">{selectedCount}개</span> 테스트케이스의 Priority를 변경합니다.
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={() => onApply(priority)}>
            적용
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sortable Row Component
interface SortableTestCaseRowProps {
  testCase: TestCase;
  index: number;
  isSelected: boolean;
  isDraggedItem: boolean;
  selectedCount: number;
  onToggleSelect: (id: string) => void;
  onRowClick: (tc: TestCase) => void;
  onToggleDropdown: (id: string, e: React.MouseEvent) => void;
  onEditClick: (tc: TestCase, e: React.MouseEvent) => void;
  onDeleteClick: (tc: TestCase, e: React.MouseEvent) => void;
  activeDropdownId: string | null;
}

const SortableTestCaseRow: React.FC<SortableTestCaseRowProps> = ({
  testCase,
  index,
  isSelected,
  isDraggedItem,
  selectedCount,
  onToggleSelect,
  onRowClick,
  onToggleDropdown,
  onEditClick,
  onDeleteClick,
  activeDropdownId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: testCase.id,
    data: {
      type: 'testcase',
      testCase,
      isSelected,
    }
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-slate-50 transition-colors cursor-pointer group relative ${
        isDragging ? 'bg-indigo-50 shadow-lg' : ''
      } ${isSelected ? 'bg-indigo-50/50' : ''} ${isDraggedItem && !isDragging ? 'opacity-50' : ''}`}
      onClick={() => onRowClick(testCase)}
    >
      {/* 체크박스 */}
      <td className="px-3 py-4 w-10" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(testCase.id)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
        />
      </td>
      {/* 드래그 핸들 */}
      <td className="px-2 py-4 w-8" onClick={(e) => e.stopPropagation()}>
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <GripVertical size={16} />
        </button>
      </td>
      {/* Section (폴더 경로) - 제일 앞 */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {testCase.folderPath && testCase.folderPath.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            {testCase.folderPath.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                {idx > 0 && <span className="text-slate-400">›</span>}
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{folder.name}</span>
              </React.Fragment>
            ))}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
        {testCase.caseNumber ? `OVDR${String(testCase.caseNumber).padStart(4, '0')}` : testCase.id.substring(0, 8).toUpperCase()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
          {testCase.title}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={
          testCase.priority === 'HIGH' ? 'error' : 
          testCase.priority === 'MEDIUM' ? 'warning' : 'success'
        }>
          {testCase.priority}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
        {testCase.expectedResult ? stripHtmlTags(testCase.expectedResult) : <span className="text-slate-300">-</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <button 
          onClick={(e) => onToggleDropdown(testCase.id, e)}
          className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        
        {/* Dropdown Menu */}
        {activeDropdownId === testCase.id && (
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 z-10 py-1">
            <button
              onClick={(e) => onEditClick(testCase, e)}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={(e) => onDeleteClick(testCase, e)}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// Droppable Folder Overlay (테스트케이스 드래그 시에만 표시)
interface DroppableFolderOverlayProps {
  folders: FolderTreeItem[];
  selectedFolderId: string | null;
  dragOverFolderId: string | null;
}

const DroppableFolderOverlay: React.FC<DroppableFolderOverlayProps> = ({
  folders,
  selectedFolderId,
  dragOverFolderId,
}) => {
  // All Cases droppable
  const { setNodeRef: setAllCasesRef, isOver: isOverAllCases } = useDroppable({
    id: 'folder-root',
    data: { type: 'folder', folderId: null }
  });

  const renderFolder = (folder: FolderTreeItem, depth: number = 0): React.ReactNode => {
    return (
      <DroppableFolderItem 
        key={folder.id} 
        folder={folder} 
        depth={depth} 
        isOver={dragOverFolderId === folder.id}
        isSelected={selectedFolderId === folder.id}
      >
        {folder.children && folder.children.length > 0 && (
          <div className="mt-0.5">
            {folder.children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </DroppableFolderItem>
    );
  };

  return (
    <div className="absolute inset-0 bg-slate-50/95 z-10">
      <div className="py-2 px-3">
        {/* All Cases - Droppable */}
        <div
          ref={setAllCasesRef}
          className={`flex items-center py-2 px-3 mb-1 cursor-pointer rounded-md text-sm transition-all ${
            isOverAllCases || dragOverFolderId === 'root'
              ? 'bg-indigo-100 ring-2 ring-indigo-400 text-indigo-700'
              : selectedFolderId === null
                ? 'bg-white border border-indigo-200 shadow-sm text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Layers size={16} className={`mr-2 ${isOverAllCases || dragOverFolderId === 'root' || selectedFolderId === null ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span className="flex-1 truncate select-none">All Cases</span>
          {(isOverAllCases || dragOverFolderId === 'root') && <FolderInput size={14} className="text-indigo-500" />}
        </div>

        {folders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
};

// Droppable Folder Item
interface DroppableFolderItemProps {
  folder: FolderTreeItem;
  depth: number;
  isOver: boolean;
  isSelected: boolean;
  children?: React.ReactNode;
}

const DroppableFolderItem: React.FC<DroppableFolderItemProps> = ({
  folder,
  depth,
  isOver,
  isSelected,
  children
}) => {
  const { setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id }
  });

  return (
    <div className="mb-0.5">
      <div
        ref={setNodeRef}
        className={`flex items-center py-2 px-3 cursor-pointer rounded-md text-sm transition-all ${
          isOver 
            ? 'bg-indigo-100 ring-2 ring-indigo-400 text-indigo-700' 
            : isSelected
              ? 'bg-white border border-indigo-200 shadow-sm text-indigo-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100 border border-transparent'
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <FolderIcon size={16} className={`mr-2 ${isOver || isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
        <span className="flex-1 truncate select-none">{folder.name}</span>
        {isOver && <FolderInput size={14} className="text-indigo-500" />}
      </div>
      {children}
    </div>
  );
};

const TestCasesPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit/Create Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  
  // Delete Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(null);

  // Folder Create Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderParentId, setFolderParentId] = useState<string | null>(null);

  // Folder Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState('');

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Drag & Drop State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const activeTestCase = testCases.find((tc) => tc.id === activeId) || null;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // 드래그 중인 항목들 (선택된 항목 포함)
  const draggedIds = useMemo(() => {
    if (!activeId) return new Set<string>();
    if (selectedIds.has(activeId)) {
      return selectedIds;
    }
    return new Set([activeId]);
  }, [activeId, selectedIds]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 폴더 변경 시 선택 초기화
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedFolderId]);

  // 폴더 트리 로드
  const loadFolderTree = async () => {
    try {
      const response = await getFolderTree();
      if (response.success) {
        setFolders(response.data);
      }
    } catch (error) {
      console.error('Failed to load folders', error);
    }
  };

  // 테스트케이스 로드
  const loadTestCases = async (folderId: string | null) => {
    try {
      setIsLoading(true);
      const response = await getTestCases(folderId || undefined);
      if (response.success) {
        setTestCases(response.data);
      }
    } catch (error) {
      console.error('Failed to load test cases', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFolderTree();
    loadTestCases(null);
  }, []);

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    loadTestCases(folderId);
  };

  const handleAddFolder = (parentId: string | null) => {
    setFolderParentId(parentId);
    setIsFolderModalOpen(true);
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name, folderParentId);
      loadFolderTree();
    } catch (error) {
      console.error('Failed to create folder', error);
    }
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    setRenamingFolderId(folderId);
    setRenamingFolderName(currentName);
    setIsRenameModalOpen(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!renamingFolderId) return;
    try {
      await renameFolder(renamingFolderId, newName);
      loadFolderTree();
    } catch (error) {
      console.error('Failed to rename folder', error);
    }
  };

  const handleSuccess = () => {
    loadTestCases(selectedFolderId);
    setSelectedIds(new Set());
  };

  // Create
  const handleCreateClick = () => {
    setEditingTestCase(null);
    setIsFormModalOpen(true);
  };

  // Edit - from row click
  const handleRowClick = (tc: TestCase) => {
    setActiveDropdownId(null);
    setEditingTestCase(tc);
    setIsFormModalOpen(true);
  };

  // Edit - from dropdown menu
  const handleEditClick = (tc: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    handleRowClick(tc);
  };

  // Delete
  const handleDeleteClick = (tc: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    setTestCaseToDelete(tc);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testCaseToDelete) return;
    try {
      await deleteTestCase(testCaseToDelete.id);
      loadTestCases(selectedFolderId);
      setTestCaseToDelete(null);
      setIsConfirmModalOpen(false);
      setSelectedIds(new Set());
    } catch (error) {
      alert('Failed to delete test case');
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === testCases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(testCases.map(tc => tc.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk Edit
  const handleBulkEdit = () => {
    setIsBulkEditModalOpen(true);
  };

  const handleBulkEditApply = async (priority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    try {
      await bulkUpdateTestCases(Array.from(selectedIds), priority);
      setIsBulkEditModalOpen(false);
      setSelectedIds(new Set());
      loadTestCases(selectedFolderId);
    } catch (error) {
      alert('일괄 수정에 실패했습니다.');
    }
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteTestCases(Array.from(selectedIds));
      setIsBulkDeleteModalOpen(false);
      setSelectedIds(new Set());
      loadTestCases(selectedFolderId);
    } catch (error) {
      alert('일괄 삭제에 실패했습니다.');
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveDropdownId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    if (!over) {
      setDragOverFolderId(null);
      return;
    }

    const overId = over.id as string;
    
    // 폴더 위에 있는지 확인
    if (overId.startsWith('folder-')) {
      const folderId = overId === 'folder-root' ? 'root' : overId.replace('folder-', '');
      setDragOverFolderId(folderId);
    } else {
      setDragOverFolderId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDragOverFolderId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overId = over.id as string;

    // 폴더로 드롭한 경우
    if (overId.startsWith('folder-')) {
      const targetFolderId = overId === 'folder-root' ? null : overId.replace('folder-', '');
      
      // 이동할 테스트케이스 ID들
      const idsToMove = selectedIds.has(activeIdStr) 
        ? Array.from(selectedIds) 
        : [activeIdStr];

      try {
        await moveTestCasesToFolder(idsToMove, targetFolderId);
        setSelectedIds(new Set());
        loadTestCases(selectedFolderId);
        loadFolderTree();
      } catch (error) {
        console.error('Failed to move test cases:', error);
        alert('테스트케이스 이동에 실패했습니다.');
      }
      return;
    }

    // 테이블 내 순서 변경
    if (activeIdStr !== overId) {
      const oldIndex = testCases.findIndex((tc) => tc.id === activeIdStr);
      const newIndex = testCases.findIndex((tc) => tc.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return;

      // 다중 선택된 경우
      if (selectedIds.has(activeIdStr) && selectedIds.size > 1) {
        // 선택된 항목들을 새 위치로 이동
        const selectedItems = testCases.filter(tc => selectedIds.has(tc.id));
        const unselectedItems = testCases.filter(tc => !selectedIds.has(tc.id));
        
        // 드롭 위치 찾기 (선택되지 않은 항목들 기준)
        const overItemInUnselected = unselectedItems.findIndex(tc => tc.id === overId);
        
        let newTestCases: TestCase[];
        if (overItemInUnselected === -1) {
          // 드롭 대상이 선택된 항목인 경우, 원래 순서 유지
          newTestCases = testCases;
        } else {
          // 선택된 항목들을 드롭 위치에 삽입
          newTestCases = [
            ...unselectedItems.slice(0, overItemInUnselected),
            ...selectedItems,
            ...unselectedItems.slice(overItemInUnselected)
          ];
        }
        
        setTestCases(newTestCases);
        
        try {
          const orderedIds = newTestCases.map((tc) => tc.id);
          await reorderTestCases(orderedIds, selectedFolderId || undefined);
        } catch (error) {
          console.error('Failed to save order:', error);
          loadTestCases(selectedFolderId);
        }
      } else {
        // 단일 항목 이동
        const newTestCases = arrayMove(testCases, oldIndex, newIndex);
        setTestCases(newTestCases);
        
        try {
          const orderedIds = newTestCases.map((tc) => tc.id);
          await reorderTestCases(orderedIds, selectedFolderId || undefined);
        } catch (error) {
          console.error('Failed to save order:', error);
          loadTestCases(selectedFolderId);
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDragOverFolderId(null);
  };

  const selectedCount = selectedIds.size;
  const draggedCount = draggedIds.size;
  const isDraggingTestCase = activeId !== null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full">
        {/* Inner Sidebar: Folder Tree */}
        <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Folders</span>
            <button 
              onClick={() => handleAddFolder(null)}
              className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
              title="New Folder"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative">
            {/* 기존 FolderTree (폴더 드래그&드롭 지원) */}
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
              onAddFolder={handleAddFolder}
              onRenameFolder={handleRenameFolder}
              onFoldersChange={loadFolderTree}
            />
            
            {/* 테스트케이스 드래그 시 드롭 가능한 오버레이 */}
            {isDraggingTestCase && (
              <DroppableFolderOverlay
                folders={folders}
                selectedFolderId={selectedFolderId}
                dragOverFolderId={dragOverFolderId}
              />
            )}
          </div>
        </div>

        {/* Main Content: Table */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Toolbar */}
          <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-end bg-white">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {selectedFolderId ? 'Test Cases' : 'All Test Cases'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {testCases.length} cases found
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                icon={<Upload size={16} />} 
                onClick={() => setIsImportModalOpen(true)}
              >
                Import
              </Button>
              <Button 
                variant="primary" 
                icon={<Plus size={16} />} 
                onClick={handleCreateClick}
              >
                Add Case
              </Button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedCount > 0 && (
            <div className="px-8 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-indigo-600" />
                <span className="font-semibold text-indigo-900 text-sm">
                  {selectedCount} test case{selectedCount > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="h-5 w-px bg-indigo-200"></div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Edit size={14} />}
                  onClick={handleBulkEdit}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={handleBulkDelete}
                >
                  Delete
                </Button>
              </div>
              <button
                onClick={handleClearSelection}
                className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <X size={14} />
                Clear selection
              </button>
            </div>
          )}

          {/* Table Area */}
          <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-slate-500">Loading...</div>
            ) : testCases.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900">No test cases found</h3>
                <p className="text-slate-500 mt-2">Select a folder or create a new test case to get started.</p>
                <div className="mt-6">
                  <Button onClick={handleCreateClick} icon={<Plus size={16} />}>
                    Create First Case
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-visible pb-32">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 w-10">
                        <button
                          onClick={handleSelectAll}
                          className="text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
                          title={selectedIds.size === testCases.length ? "Deselect All" : "Select All"}
                        >
                          {selectedIds.size > 0 && selectedIds.size === testCases.length ? 
                            <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />
                          }
                        </button>
                      </th>
                      <th className="px-2 py-3 w-8"></th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Result</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <SortableContext
                      items={testCases.map((tc) => tc.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {testCases.map((tc, index) => (
                        <SortableTestCaseRow
                          key={tc.id}
                          testCase={tc}
                          index={index}
                          isSelected={selectedIds.has(tc.id)}
                          isDraggedItem={draggedIds.has(tc.id) && tc.id !== activeId}
                          selectedCount={selectedCount}
                          onToggleSelect={handleToggleSelect}
                          onRowClick={handleRowClick}
                          onToggleDropdown={toggleDropdown}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          activeDropdownId={activeDropdownId}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 드래그 오버레이 */}
        <DragOverlay dropAnimation={null}>
          {activeTestCase && (
            <div className="bg-white shadow-xl rounded-lg border-2 border-indigo-400 p-4 opacity-95">
              <div className="flex items-center gap-3">
                <GripVertical size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{activeTestCase.title}</span>
                <Badge variant={
                  activeTestCase.priority === 'HIGH' ? 'error' : 
                  activeTestCase.priority === 'MEDIUM' ? 'warning' : 'success'
                }>
                  {activeTestCase.priority}
                </Badge>
                {draggedCount > 1 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                    +{draggedCount - 1}
                  </span>
                )}
              </div>
            </div>
          )}
        </DragOverlay>
      </div>

      {/* Modals */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentFolderId={selectedFolderId}
        onSuccess={handleSuccess}
      />

      <TestCaseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        folderId={selectedFolderId}
        onSuccess={handleSuccess}
        initialData={editingTestCase}
      />

      {testCaseToDelete && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Test Case"
          message={`Are you sure you want to delete "${testCaseToDelete.title}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        selectedCount={selectedCount}
        onClose={() => setIsBulkEditModalOpen(false)}
        onApply={handleBulkEditApply}
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="일괄 삭제"
        message={`정말 ${selectedCount}개 테스트 케이스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
      />

      <InputModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onConfirm={handleCreateFolder}
        title="새 폴더 만들기"
        placeholder="폴더 이름을 입력하세요"
        confirmText="만들기"
        cancelText="취소"
      />

      <InputModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={handleConfirmRename}
        title="폴더 이름 변경"
        placeholder="새 폴더 이름을 입력하세요"
        confirmText="변경"
        cancelText="취소"
        initialValue={renamingFolderName}
      />
    </DndContext>
  );
};

export default TestCasesPage;
