import Link from "next/link";
import { Bell, CalendarClock, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { useSubscriptionCosts } from "@/hooks/useSubscriptionCosts";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface DashboardActionCenterProps {
  subscriptions: Subscription[];
  onToggleReminder: (id: string, currentEnabled: boolean) => Promise<void>;
}

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);

export function DashboardActionCenter({ subscriptions, onToggleReminder }: DashboardActionCenterProps) {
  const { t } = useLanguage();
  const { costs, isLoading } = useSubscriptionCosts(subscriptions);
  const urgent = costs
    .filter(({ subscription }) => subscription.next_billing_date && daysUntil(subscription.next_billing_date) >= 0 && daysUntil(subscription.next_billing_date) <= 7)
    .sort((a, b) => daysUntil(a.subscription.next_billing_date!) - daysUntil(b.subscription.next_billing_date!))
    .slice(0, 3);
  const urgentSignature = useMemo(
    () => urgent.map(({ subscription }) => `${subscription.id}:${subscription.next_billing_date}`).join("|"),
    [urgent]
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem("submo-dismissed-action-center") === urgentSignature);
  }, [urgentSignature]);

  const dismiss = () => {
    localStorage.setItem("submo-dismissed-action-center", urgentSignature);
    setDismissed(true);
  };

  if (isLoading || urgent.length === 0 || dismissed) return null;

  return (
    <Card className="border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5 text-orange-500" />
            {t("dashboard.actionRequired")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary">{t("dashboard.within7Days")}</Badge>
            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8" onClick={dismiss} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {urgent.map(({ subscription }) => {
          const days = daysUntil(subscription.next_billing_date!);
          const dayLabel = days === 0 ? t("dashboard.renewsToday") : days === 1 ? t("dashboard.renewsTomorrow") : t("dashboard.renewsInDays").replace("{days}", String(days));
          return (
            <div key={subscription.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <SubscriptionIcon
                name={subscription.name}
                iconUrl={subscription.icon_url || subscription.logo_url}
                websiteUrl={subscription.website_url}
                size="sm"
              />
              <Link href={`/edit-subscription/${subscription.id}`} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <p className="truncate font-medium hover:text-primary">{subscription.name}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">{dayLabel}</p>
              </Link>
              {!subscription.reminder_enabled && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  aria-label={`${t("dashboard.enableReminder")} ${subscription.name}`}
                  title={t("dashboard.enableReminder")}
                  onClick={() => onToggleReminder(subscription.id, false)}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              <Link href={`/edit-subscription/${subscription.id}`} aria-label={`ดู ${subscription.name}`}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
