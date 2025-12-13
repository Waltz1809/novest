import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface MenuLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function MenuLink({ href, icon: Icon, label }: MenuLinkProps) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col md:flex-row items-center justify-center gap-3 py-2 md:py-3 hover:bg-white/10 transition-colors"
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
      <span className="text-[11px] md:text-lg leading-none">{label}</span>
    </Link>
  );
}
