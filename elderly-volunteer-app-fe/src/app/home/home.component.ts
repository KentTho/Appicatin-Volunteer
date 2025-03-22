import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [NgFor, NgIf, NgStyle, RouterLink, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userName: string = '';
  userAvatar: string = 'assets/default-avatar.png';
  slides: any[] = [];
  currentSlide = 0;
  slideInterval: any;
  showAvatarOptions = false;
  errorMessage = '';
  successMessage = '';
  timeoutRef: any; // Lưu timeout
  constructor(
    private router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLogin();
    this.startAutoSlide();
    this.prepareSlides();
  }

  /** 🔹 Kiểm tra user đăng nhập */
  checkLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isLoggedIn = false;
      return;
    }

    // Gọi API kiểm tra user có hợp lệ không
    this.http
      .get('http://localhost:5000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res: any) => {
          this.isLoggedIn = true;
          this.userName = res.name;
          this.userAvatar = res.avatar || 'assets/default-avatar.png';
        },
        error: () => {
          this.isLoggedIn = false;
          localStorage.removeItem('token');
        },
      });
  }

  /** 🔹 Đăng xuất */
  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  /** 🔹 Chuẩn bị dữ liệu cho slider */
  prepareSlides() {
    const newsList = [
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Tuổi trẻ Công an nhân dân cùng thanh niên tăng cường đoàn kết',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133864458147369212_484311631_981964840788801_1894601467885506971_n.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/cong-tac-tuyen-truyen-giao-duc/tuoi-tre-cong-an-nhan-dan-cung-thanh-nien-tang-cuong-doan-ket-phat-huy-suc-tre',
      },
      {
        title: 'Hỗ trợ nâng cao thể chất cho học sinh vùng sâu, vùng xa',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133757631639091909_1731224514177-7534.jpeg',
        link: 'https://doanthanhnien.vn/tin-tuc/mo-hinh-tinh-nguyen/ho-tro-nang-cao-the-chat-cho-hoc-sinh-vung-sau-vung-xa-o-tuyen-quang',
      },
      {
        title: 'Đông đảo đoàn viên thanh niên tham gia hiến máu',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133860738713830741_1_20250309150023.jpg',
        link: 'https://doanthanhnien.vn/tin-tuc/thanh-nien-tinh-nguyen/nam-dinh-dong-dao-doan-vien-thanh-nien-tinh-nguyen-tham-gia-hien-mau',
      },
      {
        title: 'Tuổi trẻ Hà Tĩnh góp sức trẻ dựng xây những ngôi nhà vững chãi',
        image:
          'https://doanthanhnien.vn/Content/uploads/images/133851209772521603_Hi%CC%80nh%201.jpg',
        link: 'https://doanthanhnien.vn/tin-tuc/thanh-nien-tinh-nguyen/tuoi-tre-ha-tinh-gop-suc-tre-dung-xay-nhung-ngoi-nha-vung-chai',
      },
    ];

    // Chia danh sách tin tức thành nhóm 6 tin
    for (let i = 0; i < newsList.length; i += 6) {
      this.slides.push(newsList.slice(i, i + 6));
    }
  }

  /** 🔹 Chuyển slide trước */
  prevSlide() {
    this.currentSlide =
      this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  /** 🔹 Chuyển slide tiếp theo */
  nextSlide() {
    this.currentSlide =
      this.currentSlide === this.slides.length - 1 ? 0 : this.currentSlide + 1;
  }

  /** 🔹 Tự động chuyển slide */
  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  /** 🔹 Dừng slider khi rời khỏi trang */
  ngOnDestroy(): void {
    clearInterval(this.slideInterval);
  }

  toggleAvatarOptions() {
    this.showAvatarOptions = !this.showAvatarOptions;
  }
  validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  uploadAvatar(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!validImageTypes.includes(file.type)) {
      this.showErrorMessage('❌ Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)!');

      // 🔥 Reset input file để có thể chọn lại ảnh
      (document.getElementById('avatarUpload') as HTMLInputElement).value = '';
      return;
    }

    const maxSizeMB = 2;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.showErrorMessage(
        `❌ Dung lượng ảnh quá lớn! Chỉ chấp nhận tối đa ${maxSizeMB}MB.`
      );

      // 🔥 Reset input file
      (document.getElementById('avatarUpload') as HTMLInputElement).value = '';
      return;
    }

    // ✅ Không kiểm tra kích thước ảnh nữa
    const token = localStorage.getItem('token');
    if (!token) {
      this.showErrorMessage('Bạn cần đăng nhập để tải ảnh lên!');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    this.http
      .post<{ message: string; avatar: string }>(
        'http://localhost:5000/users/upload-avatar',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .subscribe({
        next: (res) => {
          console.log('✅ Avatar cập nhật thành công!', res);
          this.userAvatar = `${res.avatar}?t=${new Date().getTime()}`;

          // 🔥 Reset input file để user có thể upload lại ảnh đã xóa
          (document.getElementById('avatarUpload') as HTMLInputElement).value =
            '';

          this.showSuccessMessage('🎉 Ảnh đại diện đã được cập nhật!');
        },
        error: (err) => {
          console.error('❌ Lỗi khi tải ảnh:', err);
          this.showErrorMessage('Lỗi khi tải ảnh, vui lòng thử lại!');
        },
      });
  }
  // ❌ Xóa avatar nhưng vẫn cho phép upload lại ảnh cũ
  removeAvatar() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showErrorMessage('Bạn cần đăng nhập để xóa avatar!');
      return;
    }

    this.http
      .delete<{ message: string; avatar: string }>(
        'http://localhost:5000/users/remove-avatar',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .subscribe({
        next: (res) => {
          console.log('✅ Ảnh đã bị xóa!');
          this.userAvatar = res.avatar;

          // 📌 Reset input file để user có thể upload lại ảnh cũ
          (document.getElementById('avatarUpload') as HTMLInputElement).value =
            '';

          this.showSuccessMessage(res.message);
        },
        error: (err) => {
          console.error('❌ Lỗi khi xóa ảnh:', err);
          this.showErrorMessage('Lỗi khi xóa ảnh, vui lòng thử lại!');
        },
      });
  }
  showErrorMessage(message: string) {
    this.errorMessage = message;
    this.cd.detectChanges(); // Cập nhật UI ngay lập tức

    clearTimeout(this.timeoutRef); // Xóa timeout cũ nếu có
    this.timeoutRef = setTimeout(() => {
      this.errorMessage = '';
      this.cd.detectChanges(); // Cập nhật lại sau khi ẩn thông báo
    }, 5000);
  }

  /** 🔹 Hiển thị thông báo thành công */
  showSuccessMessage(message: string) {
    this.successMessage = message;
    this.cd.detectChanges();

    clearTimeout(this.timeoutRef);
    this.timeoutRef = setTimeout(() => {
      this.successMessage = '';
      this.cd.detectChanges();
    }, 5000);
  }
}
