import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Menu, Home, BarChart3, PlusCircle, Bell, User as UserIcon, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser } from "@/services/authService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface MobileNavProps {
  user: AuthUser | null;
  isAdmin?: boolean;
}

export default function MobileNav({ user, isAdmin = false }: MobileNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUnreadNotifications();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchUnreadNotifications = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: t("toast.logoutSuccess"),
        variant: "default",
      });

      setOpen(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: t("toast.logoutError"),
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: Home, label: t("nav.home"), href: "/", color: "text-blue-600" },
    { icon: BarChart3, label: t("nav.stats"), href: "/", color: "text-green-600", hash: "#stats" },
    { icon: PlusCircle, label: t("nav.addSubscription"), href: "/add-subscription", color: "text-purple-600" },
    { icon: Bell, label: t("nav.notifications"), href: "/notifications", color: "text-orange-600", badge: unreadCount },
    { icon: UserIcon, label: t("nav.profile"), href: "/profile", color: "text-pink-600" },
  ];

  const adminMenuItems = isAdmin
    ? [
        { icon: Shield, label: t("nav.admin"), href: "/admin", color: "text-red-600" },
      ]
    : [];

  const handleNavigation = (href: string, hash?: string) => {
    setOpen(false);
    if (hash) {
      router.push(href + hash);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <div className="flex flex-col h-full">
            {/* Header with User Profile */}
            <SheetHeader className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-white text-blue-600 font-semibold text-lg">
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <SheetTitle className="text-white text-lg font-semibold">
                    {profile?.full_name || "User"}
                  </SheetTitle>
                  <p className="text-white/80 text-sm truncate">{user?.email}</p>
                  {isAdmin && (
                    <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-0">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href, item.hash)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          isActive
                            ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? item.color : "text-gray-500"}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center px-1.5">
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}

                {adminMenuItems.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    {adminMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = router.pathname === item.href;
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                            ${
                              isActive
                                ? "bg-red-50 text-red-600 font-medium shadow-sm"
                                : "text-gray-700 hover:bg-gray-100"
                            }
                          `}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? item.color : "text-gray-500"}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Logout Button */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">{t("nav.logout")}</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("dialog.logoutTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("dialog.logoutDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    {t("dialog.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
