import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useSubscriptionCosts } from "@/hooks/useSubscriptionCosts";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface TotalSpendingProps {
  subscriptions: Subscription[];
}

export function TotalSpending({ subscriptions }: TotalSpendingProps) {
  const { t } = useLanguage();
  const { preferredCurrency, formatCurrency } = useCurrency();
  const { costs, isLoading } = useSubscriptionCosts(subscriptions);
  const monthlyTotal = costs.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);
  const yearlyTotal = costs.reduce((sum, subscription) => sum + subscription.yearlyCost, 0);

  const highestCostSubscription = [...costs].sort((a, b) => b.monthlyCost - a.monthlyCost)[0];
  const topServices = [...costs]
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 8);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {t("dashboard.spendingTitle")}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-muted-foreground" aria-label="Submo.ai">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-600 text-[11px] font-black text-white">S</span>
            <span>Submo.ai</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/45 p-4">
              <p className="text-sm text-muted-foreground">{t("dashboard.monthlyTotal")}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{isLoading ? "…" : formatCurrency(monthlyTotal, preferredCurrency)}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("dashboard.yearlyTotal")}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{isLoading ? "…" : formatCurrency(yearlyTotal, preferredCurrency)}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("dashboard.activeSubscriptionsLabel")}</p>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-2xl font-bold leading-none text-foreground">{costs.length}</p>
                {topServices.length > 0 && (
                  <div className="flex items-center" aria-label={t("dashboard.activeSubscriptionsLabel")}>
                    {topServices.map((cost, index) => (
                      <SubscriptionIcon
                        key={cost.subscription.id}
                        name={cost.subscription.name}
                        websiteUrl={cost.subscription.website_url}
                        iconUrl={cost.subscription.logo_url}
                        size="sm"
                        bare
                        title={cost.subscription.name}
                        className="-ml-1 first:ml-0 h-6 w-6 ring-2 ring-background transition-opacity"
                        style={{ opacity: Math.max(0.35, 1 - index * 0.09) }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {highestCostSubscription && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("dashboard.primaryExpense")}</p>
                <p className="max-w-36 truncate text-sm font-semibold text-foreground">
                  {highestCostSubscription.subscription.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(highestCostSubscription.monthlyCost, preferredCurrency)}/{t("dashboard.monthly")}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
