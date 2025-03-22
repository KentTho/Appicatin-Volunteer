import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-show-user',
  imports: [SidebarComponent, RouterLink, NgIf],
  templateUrl: './show-user.component.html',
  styleUrl: './show-user.component.scss',
})
export class ShowUserComponent {
  user: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập!');
      return;
    }

    this.http
      .get('http://localhost:5000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res: any) => {
          console.log('📥 Dữ liệu nhận từ API:', res); // 🔍 Kiểm tra dữ liệu
          this.user = res;
        },
        error: () => {
          alert('Lỗi khi tải dữ liệu người dùng!');
        },
      });
  }
}
