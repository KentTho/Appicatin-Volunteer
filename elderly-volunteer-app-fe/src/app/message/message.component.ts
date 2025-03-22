import { Component, OnInit } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MessageService} from '../message.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-message',
  imports: [
    FormsModule,
    NgForOf,
    NgIf
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent implements OnInit {
  volunteers: any[] = []; // Danh sách tình nguyện viên
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
      this.messageService.startChatWithVolunteer(Number(this.selectedVolunteer));
      this.volunteerSelected = true;
    }
  }
}
