import Link from "next/link";
import {
  BookOpen,
  Home,
  List,
  Trophy,
  Library,
  MessageSquare,
} from "lucide-react";
import UserButton from "@/components/auth/user-button";
import SearchBar from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notification/notification-bell";
import { LibraryNotificationBell } from "@/components/notification/library-notification-bell";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { MenuLink } from "@/components/layout/menu-link";

export default function MainHeader() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full shadow-lg flex flex-col">
        {/* Top Header: Logo & Tools */}
        <div className="bg-white">
          <div className="container mx-auto py-4 md:py-6 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors shrink-0"
            >
              <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                <BookOpen size={24} />
              </div>
              <span className="font-display tracking-tight hidden sm:block">
                Novest
              </span>
            </Link>

            {/* Right Tools */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
              {/* Search Bar (Responsive) */}
              <div className="w-full max-w-md flex justify-end">
                <SearchBar />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <LibraryNotificationBell />
                <NotificationBell />
                <UserButton />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Header: Navigation Menu */}
        <div className="bg-primary text-primary-foreground shadow-md">
          <div className="container mx-auto px-2 md:px-4">
            <nav className="flex items-center justify-between font-medium">
              <MenuLink
                href="/"
                icon={Home}
                label="Trang Chủ"
              />
              <MenuLink
                href="/tim-kiem"
                icon={List}
                label="Danh sách"
              />
              <MenuLink
                href="/rankings"
                icon={Trophy}
                label="Xếp hạng"
              />
              <MenuLink
                href="/library"
                icon={Library}
                label="Tủ truyện"
              />
              <MenuLink
                href="/forum"
                icon={MessageSquare}
                label="Diễn đàn"
              />
            </nav>
          </div>
        </div>
      </header>
      {/* Site-wide Announcement Banner */}
      <AnnouncementBanner />
    </>
  );
}
