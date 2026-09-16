import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/process-instance/list';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getReportData(
    businessKey?: string,
    state?: string,
    processInitiatorId?: string,
    fromModified?: string,
    toModified?: string,
    page: number = 0,
    size: number = 10
  ): Observable<any> {
    let headers = new HttpHeaders();
    const authHeader = this.authService.getAuthHeader();
    if (authHeader) {
      headers = headers.set('Authorization', authHeader);
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'startTime')
      .set('sortDir', 'DESC');

    if (businessKey) {
      params = params.set('businessKey', businessKey);
    }
    if (state) {
      params = params.set('state', state);
    }
    if (processInitiatorId) {
      params = params.set('processInitiatorId', processInitiatorId);
    }
    if (fromModified) {
      params = params.set('fromModified', `${fromModified}T00:00:00`);
    }
    if (toModified) {
      params = params.set('toModified', `${toModified}T23:59:59`);
    }

    return this.http.get<any>(this.apiUrl, { headers, params });
  }
}