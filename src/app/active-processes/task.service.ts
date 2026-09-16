import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { PageResponse, Task } from './task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = '/task/list';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getActiveTasks(page: number = 0, size: number = 10, processInitiatorId?: string): Observable<PageResponse<Task>> {
    let headers = new HttpHeaders();
    const authHeader = this.authService.getAuthHeader();
    if (authHeader) {
      headers = headers.set('Authorization', authHeader);
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'desc');

    if (processInitiatorId) {
      params = params.set('processInitiatorId', processInitiatorId);
    }

    return this.http.get<PageResponse<Task>>(this.apiUrl, { headers, params });
  }
}
