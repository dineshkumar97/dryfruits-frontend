
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactRequest {
  fullName: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: {
    contactId: string;
    status: string;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private readonly apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) {}

  submitContact(data: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(
      this.apiUrl,
      data
    );
  }
}
