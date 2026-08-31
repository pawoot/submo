import type { ReactNode } from "react";
import { CustomerHeader } from "@/components/CustomerHeader";
import type { AuthUser } from "@/services/authService";

interface AppShellProps {
  children: ReactNode;
  /** @deprecated Header is now shared through CustomerHeader. */
  desktopHeader?: ReactNode;
  user: AuthUser | null;
  isAdmin?: boolean;
  unreadCount?: number;
}

/** Shared authenticated-page frame for consistent navigation and theme. */
export function AppShell({ children, user, unreadCount = 0 }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-foreground dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/50">
      <CustomerHeader user={user} unreadCount={unreadCount} />
      {children}
    </div>
  );
}
