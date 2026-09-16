import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { CamundaProcessDefinitionResponseDto, PageResponse, ProcessInstance } from './process-instance.model';

@Injectable({
  providedIn: 'root'
})
export class ProcessInstanceService {
  private apiUrl = '/process-instance/list';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const authHeader = this.authService.getAuthHeader();
    if (authHeader) {
      headers = headers.set('Authorization', authHeader);
    }
    return headers;
  }

  getActiveProcesses(page: number = 0, size: number = 10, processInitiatorId?: string): Observable<PageResponse<ProcessInstance>> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'DESC')
      .set('state', 'ACTIVE');
    if (processInitiatorId) {
      params = params.set('processInitiatorId', processInitiatorId);
    }
    return this.http.get<PageResponse<ProcessInstance>>(this.apiUrl, { headers, params });
  }

  getCompletedProcesses(page: number = 0, size: number = 10, processInitiatorId?: string): Observable<PageResponse<ProcessInstance>> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'DESC')
      .set('state', 'COMPLETED');
    if (processInitiatorId) {
      params = params.set('processInitiatorId', processInitiatorId);
    }
    return this.http.get<PageResponse<ProcessInstance>>(this.apiUrl, { headers, params });
  }

  startProcess(processDefinitionId: string, businessKey: string, studentIds: string[] = []): Observable<any> {
    const trimmedId = (processDefinitionId || '').trim();
    const trimmedBusinessKey = (businessKey || '').trim();
    if (!trimmedId) {
      console.error('Process Definition ID is empty!');
      return new Observable(observer => observer.error('Process Definition ID cannot be empty'));
    }
    if (!trimmedBusinessKey) {
      console.error('Business Key is empty!');
      return new Observable(observer => observer.error('Business Key cannot be empty'));
    }
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    const body = {
      processDefinitionId: trimmedId,
      businessKey: trimmedBusinessKey,
      studentIds: studentIds,
      variables: {}
    };
    console.log('Sending process start request (no file) with payload:', JSON.stringify(body, null, 2));
    const startApiUrl = '/process-instance/start';
    return this.http.post<any>(startApiUrl, body, { headers });
  }

  getProcessInstanceWithTasks(processInstanceHistoryId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `/process-instance/${processInstanceHistoryId}/with-tasks`;
    return this.http.get<any>(url, { headers });
  }

  uploadDocument(file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    const uploadUrl = 'http://localhost:9091/api/documents/upload';
    return this.http.post<string>(uploadUrl, formData, { headers, responseType: 'text' as 'json' });
  }

  downloadDocument(documentUUID: string): Observable<HttpResponse<Blob>> {
    const headers = this.getAuthHeaders();
    const downloadUrl = `/api/documents/${documentUUID}/download`;
    return this.http.get(downloadUrl, { headers, responseType: 'blob', observe: 'response' }) as Observable<HttpResponse<Blob>>;
  }

  getProcessInstanceVariables(processInstanceId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `/process-instance/${processInstanceId}/variables`;
    return this.http.get<any>(url, { headers });
  }

  
  getUsers(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const url = `/api/users`;
    console.log('ProcessInstanceService.getUsers()', { url, headers });
    return this.http.get<any[]>(url, { headers });
  }

  getProcessDefinitions(): Observable<CamundaProcessDefinitionResponseDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<CamundaProcessDefinitionResponseDto[]>('/process-instance/process-definitions', { headers });
  }

  startProcessWithVariables(processDefinitionId: string, businessKey: string, studentIds: string[], variables: any): Observable<any> {
    const trimmedId = (processDefinitionId || '').trim();
    const trimmedBusinessKey = (businessKey || '').trim();
    if (!trimmedId) {
      console.error('Process Definition ID is empty!');
      return new Observable(observer => observer.error('Process Definition ID cannot be empty'));
    }
    if (!trimmedBusinessKey) {
      console.error('Business Key is empty!');
      return new Observable(observer => observer.error('Business Key cannot be empty'));
    }
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    const camundaVariables: any = {};
    for (const [key, val] of Object.entries(variables)) {
      camundaVariables[key] = { value: val };
    }
    const body = {
      processDefinitionId: trimmedId,
      businessKey: trimmedBusinessKey,
      studentIds: studentIds,
      variables: camundaVariables
    };
    console.log('Sending process start request with payload:', JSON.stringify(body, null, 2));
    const startApiUrl = '/process-instance/start';
    return this.http.post<any>(startApiUrl, body, { headers });
  }

  startProcessWithFile(processDefinitionId: string, businessKey: string, studentIds: string[], file: File | null, withVariablesInReturn: boolean = true): Observable<any> {
    const trimmedId = (processDefinitionId || '').trim();
    const trimmedBusinessKey = (businessKey || '').trim();
    if (!trimmedId) {
      console.error('Process Definition ID is empty!');
      return new Observable(observer => observer.error('Process Definition ID cannot be empty'));
    }
    if (!trimmedBusinessKey) {
      console.error('Business Key is empty!');
      return new Observable(observer => observer.error('Business Key cannot be empty'));
    }

    const authHeader = this.authService.getAuthHeader();
    const requestObj: any = {
      processDefinitionId: trimmedId,
      businessKey: trimmedBusinessKey,
      studentIds: studentIds,
      withVariablesInReturn: withVariablesInReturn
    };

    const formData = new FormData();
    const requestBlob = new Blob([JSON.stringify(requestObj)], { type: 'application/json' });
    formData.append('request', requestBlob);
    if (file) {
      formData.append('file', file);
    }
    const startApiUrl = 'http://localhost:9091/process-instance/start';
    return new Observable<any>((observer) => {
      const headers: any = {};
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      fetch(startApiUrl, {
        method: 'POST',
        headers: headers,
        body: formData,
      }).then(async (resp) => {
        const text = await resp.text();
        if (!resp.ok) {
          try {
            const json = JSON.parse(text);
            observer.error({ status: resp.status, error: json });
          } catch {
            observer.error({ status: resp.status, error: text });
          }
          return;
        }

        try {
          const json = text ? JSON.parse(text) : null;
          observer.next(json);
        } catch {
          observer.next(text);
        }
        observer.complete();
      }).catch(err => {
        observer.error(err);
      });

      return { unsubscribe() {  } };
    });
  }
}
