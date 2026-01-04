import Link from "next/link";
import { Bell, User, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobileNav from "@/components/MobileNav";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

interface MobileHeaderProps {
  user: SupabaseUser | null;
  isAdmin?: boolean;
  unreadCount?: number;
}

export default function MobileHeader({ user, isAdmin = false, unreadCount = 0 }: MobileHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      {/* Left: Hamburger Menu */}
      <MobileNav user={user} isAdmin={isAdmin} />

      {/* Center-Left: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("home.title")}
        </span>
      </Link>

      {/* Center-Right: Add Subscription Button */}
      <Link href="/add-subscription" className="ml-auto">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          size="sm"
        >
          <Plus className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t("nav.addSubscription")}</span>
        </Button>
      </Link>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Admin Panel Button (Only for Admin Users) */}
        {isAdmin && (
          <Link href="/admin">
            <Button 
              variant="ghost" 
              size="icon"
              className="relative text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
              title="Admin Panel"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        )}

        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}