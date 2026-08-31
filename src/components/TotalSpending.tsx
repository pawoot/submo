import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useSubscriptionCosts } from "@/hooks/useSubscriptionCosts";

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

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {t("dashboard.spendingTitle")}
          </CardTitle>
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
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.activeSubscriptionsLabel")}</p>
              <p className="text-lg font-semibold text-foreground">{costs.length}</p>
            </div>

            {highestCostSubscription && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("dashboard.primaryExpense")}</p>
                <p className="max-w-36 truncate text-sm font-semibold text-foreground">
                  {highestCostSubscription.subscription.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
