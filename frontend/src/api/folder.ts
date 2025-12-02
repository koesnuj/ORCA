import api from './axios';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  sequence?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FolderTreeItem extends Folder {
  children: FolderTreeItem[];
}

export const getFolderTree = async () => {
  const response = await api.get<{ success: boolean; data: FolderTreeItem[] }>('/folders/tree');
  return response.data;
};

export const createFolder = async (name: string, parentId: string | null) => {
  const response = await api.post<{ success: boolean; data: Folder }>('/folders', { name, parentId });
  return response.data;
};

export const getFolderTestCases = async (folderId: string) => {
  const response = await api.get(`/folders/${folderId}/testcases`);
  return response.data;
};
