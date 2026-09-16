
export interface ProcessInstance {
  processInstanceHistoryId: string;
  camundaInstanceId: string;
  processDefinitionKey: string;
  businessKey: string;
  state: string;
  modifiedTime: string;
  startTime: string;
  processInitiatorId: string;
}

export interface CamundaProcessDefinitionResponseDto {
  id: string;
  key: string;
  name: string;
  version: number;
  deploymentId: string;
  tenantId: string;
}
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}