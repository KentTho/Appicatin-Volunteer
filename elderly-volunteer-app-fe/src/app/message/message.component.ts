import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-message',
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent implements OnInit {
  volunteers = []; // Danh sách tình nguyện viên
  selectedVolunteer: string | null = null; // ID tình nguyện viên được chọn
  volunteerSelected = false; // Cờ để xác định tình nguyện viên đã được chọn

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.loadVolunteers();
  }

  loadVolunteers() {
    // Giả sử chúng ta sẽ lấy danh sách tình nguyện viên từ API
    this.messageService.getVolunteers().subscribe((volunteers) => {
      this.volunteers = volunteers;
    });
  }

  startChat() {
    if (this.selectedVolunteer) {
      this.messageService.startChatWithVolunteer(this.selectedVolunteer);
      this.volunteerSelected = true;
    }
  }
}
