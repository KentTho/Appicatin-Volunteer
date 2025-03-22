import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { JoinComponent } from './pages/join/join.component';
import { ShowUserComponent } from './pages/show-user/show-user.component';
import { AppointmentCreateComponent } from './pages/appointment-create/appointment-create.component';
import { AppointmentListComponent } from './pages/appointment-list/appointment-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // Redirect từ "/" về "/home"
  { path: 'home', component: HomeComponent }, // Định nghĩa route /home
  { path: 'login', component: LoginComponent },
  { path: 'join', component: JoinComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ShowUserComponent },
  { path: 'appointments/create', component: AppointmentCreateComponent },
  { path: 'appointments', component: AppointmentListComponent },

  { path: '**', redirectTo: '/home' }, // Nếu không tìm thấy, chuyển về home
];
