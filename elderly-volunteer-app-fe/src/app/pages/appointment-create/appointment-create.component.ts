import { NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-appointment-create',
  imports: [FormsModule, NgIf, SidebarComponent, NgFor],
  templateUrl: './appointment-create.component.html',
  styleUrl: './appointment-create.component.scss',
})
export class AppointmentCreateComponent implements OnInit {
  volunteers: any[] = []; // ✅ Danh sách tình nguyện viên
  selectedVolunteer: string = ''; // ✅ ID tình nguyện viên được chọn
  date: string = ''; // ✅ Ngày hẹn (string)
  notes: string = ''; // ✅ Ghi chú
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadVolunteers();
  }

  // 🟢 Lấy danh sách tình nguyện viên từ BE
  loadVolunteers() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Bạn cần đăng nhập!';
      return;
    }

    this.http
      .get('http://localhost:5000/appointments/volunteers', {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Lỗi khi tải danh sách tình nguyện viên:', error);
          this.errorMessage = 'Không thể tải danh sách tình nguyện viên!';
          return throwError(error);
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('✅ Danh sách tình nguyện viên:', res);
          this.volunteers = res;
        },
      });
  }

  // 🟢 Gửi yêu cầu tạo lịch hẹn
  createAppointment() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const elderlyId = user._id;
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMessage = 'Bạn cần đăng nhập!';
      return;
    }

    if (!elderlyId || !this.selectedVolunteer || !this.date) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin!';
      return;
    }

    // ✅ Chuyển đổi ngày thành `ISOString` để BE nhận đúng múi giờ
    const formattedDate = new Date(this.date).toISOString();

    const appointmentData = {
      elderlyId,
      volunteerId: this.selectedVolunteer,
      date: formattedDate,
      notes: this.notes,
    };

    console.log('📤 Gửi dữ liệu lịch hẹn:', appointmentData);

    this.http
      .post('http://localhost:5000/appointments/create', appointmentData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Lỗi khi đặt lịch hẹn:', error);
          this.errorMessage = 'Lỗi khi đặt lịch hẹn!';
          return throwError(error);
        })
      )
      .subscribe({
        next: () => {
          alert('🎉 Đặt lịch hẹn thành công!');
          this.router.navigate(['/appointments']);
        },
      });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
