
export interface Task {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  created?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  processInstanceId?: string;
}
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
