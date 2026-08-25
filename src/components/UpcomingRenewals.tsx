import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { useRouter } from "next/router";
import { SubscriptionIcon } from "./SubscriptionIcon";
import { ConvertedCurrencyAmount } from "./ConvertedCurrencyAmount";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface UpcomingRenewalsProps {
  subscriptions: Subscription[];
}

export function UpcomingRenewals({ subscriptions }: UpcomingRenewalsProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const now = new Date();
  const upcomingSubscriptions = subscriptions
    .filter(sub => {
      if (!sub.next_billing_date || !sub.is_active) return false;
      const nextDate = new Date(sub.next_billing_date);
      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => {
      const dateA = new Date(a.next_billing_date!).getTime();
      const dateB = new Date(b.next_billing_date!).getTime();
      return dateA - dateB;
    })
    .slice(0, 5);

  const getDaysUntilText = (nextBillingDate: string) => {
    const nextDate = new Date(nextBillingDate);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 0) return t("dashboard.today");
    if (daysUntil === 1) return t("dashboard.tomorrow");
    return `${daysUntil} ${t("dashboard.days")}`;
  };

  const getUrgencyColor = (nextBillingDate: string) => {
    const nextDate = new Date(nextBillingDate);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 3) return "text-red-600 dark:text-red-400";
    if (daysUntil <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-blue-600 dark:text-blue-400";
  };

  if (upcomingSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {t("dashboard.upcomingTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">{t("dashboard.noUpcoming")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          {t("dashboard.upcomingTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingSubscriptions.map(sub => (
          <div
            key={sub.id}
            className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors bg-card"
            onClick={() => router.push(`/edit-subscription/${sub.id}`)}
          >
            <SubscriptionIcon
              name={sub.name}
              iconUrl={sub.icon_url || sub.logo_url}
              websiteUrl={sub.website_url}
              size="sm"
            />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{sub.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {sub.category && (
                  <Badge variant="secondary" className="text-xs">
                    {sub.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <ConvertedCurrencyAmount
                amount={sub.amount}
                currency={sub.currency}
                className="font-bold text-sm"
                originalClassName="text-[11px] text-muted-foreground"
              />
              <p className={`text-xs font-medium ${getUrgencyColor(sub.next_billing_date!)}`}>
                {getDaysUntilText(sub.next_billing_date!)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
