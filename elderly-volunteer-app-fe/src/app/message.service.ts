import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private http: HttpClient) {}

  getMessages(conversationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/messages/${conversationId}`);
  }

  sendMessage(conversationId: string, message: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/messages`, {
      conversationId,
      message,
    });
  }
}
