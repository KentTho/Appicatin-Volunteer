import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private http: HttpClient) {
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/messages/${conversationId}`);
  }

  sendMessage(conversationId: string, message: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/messages`, {
      conversationId,
      message,
    });
  }

  // Lấy danh sách tình nguyện viên
  getVolunteers(): Observable<Volunteer[]> {
    return this.http.get<Volunteer[]>(`${environment.apiUrl}/volunteers`);
  }

  // Bắt đầu trò chuyện với tình nguyện viên
  startChatWithVolunteer(volunteerId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/chat/start`, {volunteerId});
  }
}
// Định nghĩa interface Volunteer
  export interface Volunteer {
  id: number;
  name: string;
  // Các thuộc tính khác nếu cần
}
