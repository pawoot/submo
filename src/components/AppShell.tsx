import type { ReactNode } from "react";
import MobileHeader from "@/components/MobileHeader";
import type { AuthUser } from "@/services/authService";

interface AppShellProps {
  children: ReactNode;
  desktopHeader: ReactNode;
  user: AuthUser | null;
  isAdmin?: boolean;
  unreadCount?: number;
}

/** Shared authenticated-page frame for consistent navigation and theme. */
export function AppShell({ children, desktopHeader, user, isAdmin = false, unreadCount = 0 }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-foreground dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/50">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 md:hidden">
        <MobileHeader user={user} isAdmin={isAdmin} unreadCount={unreadCount} />
      </div>
      <header className="sticky top-0 z-50 hidden border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 md:block">
        {desktopHeader}
      </header>
      {children}
    </div>
  );
}
