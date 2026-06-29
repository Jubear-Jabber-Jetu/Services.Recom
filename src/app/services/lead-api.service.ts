import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LeadPayload } from '../models/lead.models';

@Injectable({ providedIn: 'root' })
export class LeadApiService {
  private readonly leadsUrl = `${environment.apiBaseUrl}/api/recom/leads`;

  constructor(private http: HttpClient) {}

  submitLead(payload: LeadPayload): Observable<{ message: string; leadId: number }> {
    const { submittedAt: _, ...body } = payload;
    return this.http.post<{ message: string; leadId: number }>(this.leadsUrl, body);
  }
}
