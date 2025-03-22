import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { UserFormComponent } from '../../components/user-form/user-form.component';

@Component({
  selector: 'app-join',
  imports: [SidebarComponent, UserFormComponent],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss',
})
export class JoinComponent {}
