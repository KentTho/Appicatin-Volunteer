import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, NgIf],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  user: any = {}; // Thông tin người dùng
  showVolunteerSelector: boolean = false; // Điều kiện hiển thị phần chọn tình nguyện viên
  volunteers: any[] = []; // Danh sách tình nguyện viên
  selectedVolunteer: any; // Tình nguyện viên được chọn

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  // Kiểm tra xem người dùng có phải là người cao tuổi (elderly) hay không
  isElderly(): boolean {
    return this.user.role === 'elderly';
  }

  // Mở phần chọn tình nguyện viên
  openMessages() {
    if (this.isElderly()) {
      this.showVolunteerSelector = true; // Hiển thị phần chọn tình nguyện viên
      this.loadVolunteers(); // Tải danh sách tình nguyện viên
    }
  }

  // Lấy danh sách tình nguyện viên từ API (hoặc dữ liệu giả)
  loadVolunteers() {
    this.messageService.getVolunteers().subscribe((data) => {
      this.volunteers = data;
    });
  }

  // Bắt đầu trò chuyện với tình nguyện viên đã chọn
  startChat() {
    if (this.selectedVolunteer) {
      this.messageService
        .startChatWithVolunteer(this.selectedVolunteer.id)
        .subscribe(() => {
          // Chuyển sang trang trò chuyện hoặc mở modal
          console.log(
            `Bắt đầu trò chuyện với tình nguyện viên: ${this.selectedVolunteer.name}`
          );
        });
    } else {
      alert('Vui lòng chọn một tình nguyện viên.');
    }
  }
}
