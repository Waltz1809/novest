import { auth } from "@/auth";
import { User } from "lucide-react";
import UserMenu from "./user-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function UserButton() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Button
        asChild
        size="lg"
      >
        <Link
          href="/login"
          className="flex items-center gap-2"
        >
          <User size={24} />
          Đăng nhập
        </Link>
      </Button>
    );
  }

  return <UserMenu user={session.user} />;
}
