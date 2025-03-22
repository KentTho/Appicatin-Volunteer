import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/users'; // Đổi đúng link backend

  constructor(private http: HttpClient) {}

  // Gọi API đăng ký
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // Gọi API đăng nhập
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        // Giả sử backend trả về token trong response
        if (response && response.token) {
          localStorage.setItem('token', response.token); // Lưu token vào localStorage
        }
      })
    );
  } // Lấy token từ localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Xóa token khỏi localStorage
  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Lấy thông tin người dùng (ví dụ)
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Phương thức để lấy headers Authorization
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
  }
}
