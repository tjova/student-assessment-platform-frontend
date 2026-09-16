import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { PageResponse, StudentTask } from './student-task.model';

@Injectable({
  providedIn: 'root'
})
export class StudentTaskService {
  private apiUrl = '/task/list';
  private claimApiUrl = '/task/claim';
  private completeApiUrl = '/task/complete';

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

  getAssignedTasks(page: number = 0, size: number = 10, state: string = 'ACTIVE'): Observable<PageResponse<StudentTask>> {
    const headers = this.getAuthHeaders();
    const currentUsername = this.authService.getUsername();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'desc')
      .set('state', state);

    if (currentUsername) {
      params = params.set('assignee', currentUsername);
    }

    return this.http.get<PageResponse<StudentTask>>(this.apiUrl, { headers, params });
  }

  
  getTasks(page: number = 0, size: number = 10, state: string = 'ACTIVE'): Observable<PageResponse<StudentTask>> {
    const headers = this.getAuthHeaders();

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'desc')
      .set('state', state);

    return this.http.get<PageResponse<StudentTask>>(this.apiUrl, { headers, params });
  }

  
  getTasksByInitiator(initiatorId: string, page: number = 0, size: number = 10, state: string = 'ACTIVE'): Observable<PageResponse<StudentTask>> {
    const headers = this.getAuthHeaders();

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'desc')
      .set('processInitiatorId', initiatorId)
      .set('state', state);

    return this.http.get<PageResponse<StudentTask>>(this.apiUrl, { headers, params });
  }

  
  getTaskReport(state?: string, taskName?: string, fromModified?: string, toModified?: string, businessKey?: string, page: number = 0, size: number = 10): Observable<PageResponse<StudentTask>> {
    const headers = this.getAuthHeaders();
    const currentUsername = this.authService.getUsername();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'desc');

    if (currentUsername) params = params.set('assignee', currentUsername);
    if (state)          params = params.set('state', state);
    if (taskName)       params = params.set('taskName', taskName);
    if (fromModified)   params = params.set('fromModified', `${fromModified}T00:00:00`);
    if (toModified)     params = params.set('toModified', `${toModified}T23:59:59`);
    if (businessKey)    params = params.set('businessKey', businessKey);

    return this.http.get<PageResponse<StudentTask>>(this.apiUrl, { headers, params });
  }

  claimTask(taskId: string): Observable<any> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    const url = `/task/${taskId}/claim`;
    const body = { userId: this.authService.getUsername() };
    return this.http.post<any>(url, body, { headers });
  }

  forceClaimTask(taskId: string): Observable<any> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    const url = `/task/${taskId}/force-claim`;
    const body = { userId: this.authService.getUsername() };
    return this.http.post<any>(url, body, { headers });
  }

  completeTask(taskId: string, formData: Record<string, any> = {}): Observable<any> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    const body = { taskId, formData };
    return this.http.post<any>(this.completeApiUrl, body, { headers });
  }

  completeTaskWithFile(taskId: string, variables: Record<string, any> = {}, file?: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `/task/${taskId}/complete-with-file`;

    const formData = new FormData();
    const variablesPayload = JSON.stringify({
      variables: variables,
      withVariablesInReturn: true
    });
    formData.append('variables', new Blob([variablesPayload], { type: 'application/json' }));

    if (file) {
      formData.append('uploadedFile', file);
    }

    return this.http.post<any>(url, formData, { headers });
  }

  completeTaskWithVariables(taskId: string, variables: Record<string, any> = {}): Observable<any> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    const url = `/task/${taskId}/complete`;
    const body = { variables, withVariablesInReturn: true };
    return this.http.post<any>(url, body, { headers });
  }

  getTaskHistory(taskId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `/task/${taskId}`;
    return this.http.get<any>(url, { headers });
  }

  getAttachmentFile(attachmentId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();
    const url = `http://localhost:9091/process-instance/files/${attachmentId}`;
    return this.http.get(url, { headers, responseType: 'blob' });
  }
}