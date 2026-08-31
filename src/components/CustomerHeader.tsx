import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Bell, Check, Globe, LogOut, Plus, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { authService, type AuthUser } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import { useLanguage } from "@/contexts/LanguageContext";

type CustomerHeaderProps = {
  user?: AuthUser | null;
  unreadCount?: number;
};

/** The one authenticated-customer header used across customer pages. */
export function CustomerHeader({ user: suppliedUser, unreadCount: suppliedUnreadCount }: CustomerHeaderProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [loadedUser, setLoadedUser] = useState<AuthUser | null>(null);
  const [loadedUnreadCount, setLoadedUnreadCount] = useState(0);
  const user = suppliedUser === undefined ? loadedUser : suppliedUser;
  const unreadCount = suppliedUnreadCount === undefined ? loadedUnreadCount : suppliedUnreadCount;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "บัญชีของฉัน";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  useEffect(() => {
    if (suppliedUser !== undefined && suppliedUnreadCount !== undefined) return;
    Promise.all([
      suppliedUser === undefined ? authService.getCurrentUser() : Promise.resolve(null),
      suppliedUnreadCount === undefined ? notificationService.getUnreadCount().catch(() => 0) : Promise.resolve(0),
    ]).then(([currentUser, count]) => {
      if (suppliedUser === undefined) setLoadedUser(currentUser);
      if (suppliedUnreadCount === undefined) setLoadedUnreadCount(count);
    });
  }, [suppliedUnreadCount, suppliedUser]);

  const signOut = async () => {
    await authService.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="Submo dashboard">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-sm">S</span>
            <span className="hidden text-2xl font-bold tracking-tight sm:inline bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Submo<span className="text-base">.ai</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/add-subscription">
            <Button size="sm" className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 sm:px-4">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t("dashboard.addItem")}</span>
              <span className="sr-only sm:hidden">{t("dashboard.addItem")}</span>
            </Button>
          </Link>
          <Link href="/notifications" aria-label={`การแจ้งเตือน${unreadCount ? ` ${unreadCount} รายการ` : ""}`}>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <Badge variant="destructive" className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px]">{unreadCount > 99 ? "99+" : unreadCount}</Badge>}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label="เปิดเมนูบัญชี">
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={avatarUrl} alt="รูปโปรไฟล์" />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"><UserRound className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/profile")} className="cursor-pointer"><UserRound className="mr-2 h-4 w-4" />{t("dashboard.profile")}</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer"><Globe className="mr-2 h-4 w-4" />{t("dashboard.language")}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  <DropdownMenuItem onSelect={() => setLanguage("th")} className="cursor-pointer"><span className="mr-2">🇹🇭</span>ไทย{language === "th" && <Check className="ml-auto h-4 w-4" />}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setLanguage("en")} className="cursor-pointer"><span className="mr-2">🇬🇧</span>English{language === "en" && <Check className="ml-auto h-4 w-4" />}</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut} className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"><LogOut className="mr-2 h-4 w-4" />{t("dashboard.signOut")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
