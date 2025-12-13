import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, MapPin } from "lucide-react";

export default function MainFooter() {
  return (
    <footer className="w-full bg-primary text-primary-foreground border-t border-white/20 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white font-merriweather">
              Novest
            </h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Nền tảng đọc truyện chữ hàng đầu Việt Nam. Kho tàng truyện khổng
              lồ, đa dạng thể loại, cập nhật liên tục.
            </p>
          </div>

          {/* Discovery Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">Khám Phá</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link
                  href="/rankings"
                  className="hover:text-white transition-colors"
                >
                  Bảng Xếp Hạng
                </Link>
              </li>
              <li>
                <Link
                  href="/latest"
                  className="hover:text-white transition-colors"
                >
                  Mới Cập Nhật
                </Link>
              </li>
              <li>
                <Link
                  href="/genres"
                  className="hover:text-white transition-colors"
                >
                  Thể Loại
                </Link>
              </li>
              <li>
                <Link
                  href="/completed"
                  className="hover:text-white transition-colors"
                >
                  Truyện Hoàn Thành
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Điều Khoản Dịch Vụ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Chính Sách Bảo Mật
                </Link>
              </li>
              <li>
                <Link
                  href="/dmca"
                  className="hover:text-primary transition-colors"
                >
                  Khiếu Nại Bản Quyền
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Liên Hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">
              Kết Nối Với Chúng Tôi
            </h4>
            <div className="flex gap-4">
              <Link
                href="#"
                className="bg-white text-primary p-2 rounded-full hover:bg-white/90 transition-all hover:scale-110 shadow-lg"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="bg-white text-primary p-2 rounded-full hover:bg-white/90 transition-all hover:scale-110 shadow-lg"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="bg-white text-primary p-2 rounded-full hover:bg-white/90 transition-all hover:scale-110 shadow-lg"
              >
                <Instagram className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/60">
          <p>© 2025 Novest. All rights reserved.</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>support@novest.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Vietnam</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
