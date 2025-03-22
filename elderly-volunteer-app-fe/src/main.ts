import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
const socketConfig: SocketIoConfig = {
  url: 'http://localhost:5000',
  options: {},
};
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Kết nối router
    importProvidersFrom(
      HttpClientModule,
      BrowserAnimationsModule,
      SocketIoModule.forRoot(socketConfig),
      ToastrModule.forRoot({
        positionClass: 'toast-top-right', // Hiển thị góc phải trên
        timeOut: 5000, // Thời gian hiển thị
        closeButton: true, // Hiện nút đóng
        progressBar: true, // Hiện thanh tiến trình
        preventDuplicates: true, // Ngăn hiển thị trùng
      })
    ), // Cho phép gọi API
  ],
});
