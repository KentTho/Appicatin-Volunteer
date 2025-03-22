import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  imports: [FormsModule, NgIf],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  user: any = {
    name: '',
    email: '',
    role: '',
    phone: '',
    address: '',
    location: '',
    preferences: '',
    bio: '',
    languages: '',
    skills: '',
    experience: '',
  };

  step = 1;
  successMessage = '';
  errorMessage = '';
  fieldErrors: any = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showMessage('error', 'Bạn cần đăng nhập!');
      return;
    }

    this.http
      .get('http://localhost:5000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res: any) => {
          this.user = {
            name: '',
            email: '',
            role: '',
            phone: '',
            address: '',
            location: '',
            preferences: '',
            bio: '',
            languages: '',
            skills: '',
            experience: '',
            ...res,
          };
        },
        error: () => {
          this.showMessage('error', 'Lỗi khi tải dữ liệu người dùng!');
        },
      });
  }

  validateFields(step: number): boolean {
    let isValid = true;
    this.fieldErrors = {};

    const checkField = (field: string, message: string) => {
      if (
        !this.user[field] ||
        typeof this.user[field] !== 'string' ||
        !this.user[field].trim()
      ) {
        this.fieldErrors[field] = message;
        isValid = false;
      }
    };

    if (step === 1) {
      checkField('name', '⚠️ Họ và tên không được để trống!');
      checkField('email', '⚠️ Email không được để trống!');
    }

    if (step === 2) {
      checkField('phone', '📵 Số điện thoại không được để trống!');
      checkField('address', '⚠️ Địa chỉ không được để trống!');
      checkField('location', '⚠️ Vị trí không được để trống!');

      if (this.user.phone && !/^[0-9]{9,11}$/.test(this.user.phone)) {
        this.fieldErrors.phone = '📵 Số điện thoại không hợp lệ! Nhập 9-11 số.';
        isValid = false;
      }
    }

    if (step === 3) {
      ['preferences', 'languages', 'skills'].forEach((field) => {
        checkField(field, `⚠️ ${field} không được để trống!`);
        if (
          this.user[field] &&
          !/^[A-Za-zÀ-Ỹà-ỹ\s,]+$/.test(this.user[field])
        ) {
          this.fieldErrors[
            field
          ] = `❌ ${field} chỉ được chứa chữ cái và dấu phẩy!`;
          isValid = false;
        }
      });
    }

    if (!isValid) {
      this.showMessage('error', '⚠️ Vui lòng kiểm tra lại các trường nhập!');
    }
    return isValid;
  }

  nextStep() {
    if (this.validateFields(this.step)) {
      this.step++;
    }
  }
  getRoleLabel(role: string): string {
    if (role === 'elderly') return 'Người lớn tuổi';
    if (role === 'volunteer') return 'Tình nguyện viên';
    return 'Không xác định';
  }
  prevStep() {
    if (this.step > 1) this.step--;
  }

  updateUser() {
    if (!this.validateFields(this.step)) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.showMessage('error', 'Bạn cần đăng nhập!');
      return;
    }

    this.http
      .put('http://localhost:5000/users/update', this.user, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          this.showMessage('success', '🎉 Cập nhật thành công!');

          // 🔥 Gọi lại API để lấy dữ liệu mới ngay sau khi cập nhật
          this.loadUserData();

          setTimeout(() => {
            this.router.navigate(['/profile']); // Điều hướng về trang hồ sơ
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Lỗi khi cập nhật:', error);
          this.showMessage(
            'error',
            `❌ Lỗi: ${error.error?.error || 'Không rõ nguyên nhân!'}`
          );
        },
      });
  }

  // 📌 Hàm chọn file từ input
  selectedFile: File | null = null;
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  showMessage(type: 'success' | 'error', message: string) {
    if (type === 'success') {
      this.successMessage = message;
    } else {
      this.errorMessage = message;
    }

    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }
}
