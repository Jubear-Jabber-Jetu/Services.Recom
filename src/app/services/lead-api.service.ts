import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../environments/environment';
import { LeadPayload } from '../models/lead.models';

@Injectable({ providedIn: 'root' })
export class LeadApiService {
  constructor(private http: HttpClient) {}

  submitLead(payload: LeadPayload): Observable<void> {
    if (!environment.formEndpoint) {
      return of(undefined).pipe(delay(700));
    }
    return this.http.post<void>(environment.formEndpoint, payload);
  }
}
