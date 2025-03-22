import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = '';
  errors: any = {};

  constructor(
    private http: HttpClient, // Sử dụng HttpClient để gọi API
    private router: Router,
    private toastr: ToastrService
  ) {}

  validateField(field: keyof RegisterComponent) {
    if (!this[field]) {
      this.errors[field] = `Vui lòng nhập ${
        field === 'role' ? 'vai trò' : field
      }`;
    } else {
      delete this.errors[field];
    }
  }

  register() {
    this.errors = {}; // Reset lỗi

    if (!this.name) this.errors.name = 'Vui lòng nhập họ và tên';
    if (!this.email) this.errors.email = 'Vui lòng nhập email';
    if (!this.password) this.errors.password = 'Vui lòng nhập mật khẩu';
    if (!this.confirmPassword)
      this.errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    if (this.password !== this.confirmPassword)
      this.errors.confirmPassword = 'Mật khẩu không khớp';
    if (!this.role) this.errors.role = 'Vui lòng chọn vai trò';

    if (Object.keys(this.errors).length > 0) {
      this.toastr.error('Vui lòng điền đầy đủ thông tin!', 'Lỗi');
      return;
    }

    // Gửi dữ liệu lên backend
    const userData = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
    };

    this.http.post('http://localhost:5000/users/register', userData).subscribe({
      next: (res: any) => {
        if (this.role === 'elderly') {
          this.toastr.success(
            'Đăng ký thành công! Bạn có thể đăng nhập ngay mà không cần xác nhận email.',
            'Thành công'
          );
        } else {
          this.toastr.success(
            'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.',
            'Thành công'
          );
        }

        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        console.error('Lỗi đăng ký:', err);
        this.toastr.error(
          err.error?.error || 'Đăng ký thất bại, vui lòng thử lại!',
          'Lỗi'
        );
      },
    });
  }
}
