
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type ContactStatus = 'NEW' | 'READ' | 'REPLIED' | 'CLOSED';
export interface SendContactReplyResponse {
  success: boolean;
  message: string;
  data: ContactEnquiry;
}
export interface ContactEnquiry {
  _id: string;
  fullName: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
  replies?: ContactReply[];
}
export interface ContactReply {
  _id?: string;
  message: string;
  adminName?: string;
  adminEmail?: string;
  sentAt: string;
}
export interface ContactEnquiryResponse {
  success: boolean;
  message: string;
  data: ContactEnquiry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleContactResponse {
  success: boolean;
  message: string;
  data: ContactEnquiry;
}

export interface UpdateContactStatusResponse {
  success: boolean;
  message: string;
  data: ContactEnquiry;
}

@Injectable({
  providedIn: 'root'
})
export class ContactEnquiryService {

  private readonly apiUrl = `${environment.apiUrl}/contact`;
  private readonly tokenKey = 'nutnest-access-token';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  getAllContacts(
    page: number = 1,
    limit: number = 10,
    status?: ContactStatus | '',
    search: string = ''
  ): Observable<ContactEnquiryResponse> {

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (status) {
      params = params.set('status', status);
    }

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ContactEnquiryResponse>(
      this.apiUrl,
      {
        params,
        headers: this.getHeaders()
      }
    );
  }

  getContactById(id: string): Observable<SingleContactResponse> {
    return this.http.get<SingleContactResponse>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateContactStatus(
    id: string,
    status: ContactStatus
  ): Observable<UpdateContactStatusResponse> {

    return this.http.patch<UpdateContactStatusResponse>(
      `${this.apiUrl}/${id}/status`,
      { status },
      {
        headers: this.getHeaders()
      }
    );
  }

  sendReply(
  id: string,
  replyMessage: string
): Observable<SendContactReplyResponse> {
  return this.http.post<SendContactReplyResponse>(
    `${this.apiUrl}/${id}/reply`,
    { replyMessage },
    { headers: this.getHeaders() }
  );
}
}
