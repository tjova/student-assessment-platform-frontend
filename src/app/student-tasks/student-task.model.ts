
export interface StudentTask {
  id: string;
  name: string;
  taskName?: string;
  description?: string;
  processInstanceId?: string;
  created?: string;
  startTime?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  claimedBy?: string;
  claimedAt?: string;
  formData?: Record<string, any>;
  taskDefinition?: string;
  completedAt?: string;
}
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
