import { CommonModule, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointment-list',
  imports: [NgIf, NgFor, CommonModule, SidebarComponent, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss',
})
export class AppointmentListComponent implements OnInit {
  appointments: any[] = [];
  errorMessage = '';
  user: any = {};
  ratingData: { [key: string]: { rating: number; comment: string } } = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!this.user._id || !token) {
      this.errorMessage = 'Bạn cần đăng nhập!';
      return;
    }

    this.http
      .get(
        `http://localhost:5000/appointments/userAppointments/${this.user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe({
        next: (res: any) => {
          this.appointments = res;

          res.forEach((appointment: any) => {
            if (!appointment.rating) {
              this.ratingData[appointment._id] = { rating: 0, comment: '' };
            }
          });
        },
        error: () => {
          this.errorMessage = 'Lỗi khi tải danh sách lịch hẹn!';
        },
      });
  }

  confirmAppointment(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xác nhận lịch hẹn này?')) return;

    this.http
      .put(
        `http://localhost:5000/appointments/confirm/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      .subscribe({
        next: () => {
          alert('Lịch hẹn đã được xác nhận!');
          this.loadAppointments();
        },
        error: (err) => {
          alert(err.error.message || 'Lỗi khi xác nhận lịch hẹn!');
        },
      });
  }

  completeAppointment(id: string) {
    if (!confirm('Bạn có chắc chắn muốn hoàn thành cuộc hẹn này?')) return;

    this.http
      .put(
        `http://localhost:5000/appointments/complete/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      .subscribe({
        next: () => {
          alert('Cuộc hẹn đã được hoàn thành!');
          this.loadAppointments();
        },
        error: () => {
          alert('Lỗi khi hoàn thành cuộc hẹn!');
        },
      });
  }

  cancelAppointment(id: string) {
    this.http
      .put(
        `http://localhost:5000/appointments/cancel/${id}`,
        { cancelReason: 'Người dùng đã hủy' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      .subscribe({
        next: () => {
          alert('Lịch hẹn đã được hủy!');
          this.loadAppointments();
        },
        error: () => {
          alert('Lỗi khi hủy lịch hẹn!');
        },
      });
  }

  rateAppointment(appointmentId: string) {
    const { rating, comment } = this.ratingData[appointmentId] || {};

    if (!rating || rating < 1 || rating > 5) {
      alert('Vui lòng chọn mức đánh giá từ 1 đến 5 sao.');
      return;
    }

    if (!comment?.trim()) {
      alert('Vui lòng nhập nhận xét trước khi gửi đánh giá.');
      return;
    }

    this.http
      .put(
        `http://localhost:5000/appointments/rate/${appointmentId}`,
        { rating, comment },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      .subscribe({
        next: () => {
          alert('Đánh giá thành công!');
          this.loadAppointments();
        },
        error: (err) => {
          alert(err.error.message || 'Lỗi khi đánh giá. Vui lòng thử lại.');
        },
      });
  }

  isElderly(): boolean {
    return this.user.role === 'elderly';
  }

  isVolunteer(): boolean {
    return this.user.role === 'volunteer';
  }

  goHome() {
    this.router.navigate(['/appointments/create']);
  }

  onDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target || !target.value) {
      return;
    }
    this.filterAppointmentsByDate(target.value);
  }

  filterAppointmentsByDate(date: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Bạn cần đăng nhập!';
      return;
    }

    this.http
      .get(`http://localhost:5000/appointments/by-date?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res: any) => {
          this.appointments = res;
        },
        error: () => {
          this.errorMessage = 'Không thể tải lịch hẹn theo ngày!';
        },
      });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: '⏳ Đang chờ xác nhận',
      confirmed: '✅ Đã xác nhận',
      completed: '🎉 Hoàn thành',
      canceled: '❌ Đã hủy',
    };
    return statusMap[status] || '⚠️ Không xác định';
  }
}
