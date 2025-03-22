import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.errorMessage = '⚠️ Vui lòng nhập đầy đủ thông tin!';
      return;
    }

    const payload = { email: this.email, password: this.password };
    console.log('🚀 Payload login:', payload);

    this.http.post('http://localhost:5000/users/login', payload).subscribe({
      next: (res: any) => {
        console.log('✅ Đăng nhập thành công!', res);

        // Lưu token & user vào localStorage
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        // Hiển thị thông báo thành công
        this.toastr.success('🎉 Đăng nhập thành công!', 'Thành công!', {
          timeOut: 5000,
          closeButton: true,
          progressBar: true,
        });

        // Chuyển hướng đến trang chính
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('❌ Lỗi đăng nhập:', err);
        this.toastr.error(
          err.error?.message || 'Sai thông tin đăng nhập!',
          '❌ Lỗi!',
          {
            timeOut: 5000,
            closeButton: true,
            progressBar: true,
          }
        );
      },
    });
  }

  // Hàm để gọi các API yêu cầu xác thực (có thể thêm vào sau khi login)
  fetchProtectedData() {
    const token = localStorage.getItem('token');
    this.http
      .get('http://localhost:5000/protected-route', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .subscribe((data) => {
        console.log('Dữ liệu bảo mật:', data);
      });
  }
}
