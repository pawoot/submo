import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber } from "@/lib/utils";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface TotalSpendingProps {
  subscriptions: Subscription[];
}

export function TotalSpending({ subscriptions }: TotalSpendingProps) {
  const { t } = useLanguage();
  const { preferredCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");

  const activeSubscriptions = subscriptions.filter(s => s.is_active);

  // Calculate monthly total
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const monthlyCost = sub.billing_cycle === "yearly" 
      ? (sub.amount / 12)
      : sub.amount;
    return sum + monthlyCost;
  }, 0);

  // Calculate yearly total
  const yearlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const yearlyCost = sub.billing_cycle === "yearly" 
      ? sub.amount
      : sub.amount * 12;
    return sum + yearlyCost;
  }, 0);

  // Mock comparison (in real app, would come from historical data)
  const previousMonthTotal = monthlyTotal * 0.92; // Mock: 8% increase
  const changePercent = ((monthlyTotal - previousMonthTotal) / previousMonthTotal * 100);
  const isIncrease = changePercent > 0;

  const displayAmount = viewMode === "monthly" ? monthlyTotal : yearlyTotal;
  const displayUnit = viewMode === "monthly" ? t("dashboard.perMonth") : t("dashboard.perYear");

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {t("dashboard.spendingTitle")}
          </CardTitle>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "monthly" ? "default" : "ghost"}
              onClick={() => setViewMode("monthly")}
              className="h-7 text-xs"
            >
              {t("dashboard.monthly")}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "yearly" ? "default" : "ghost"}
              onClick={() => setViewMode("yearly")}
              className="h-7 text-xs"
            >
              {t("dashboard.yearly")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Amount */}
          <div>
            <p className="text-4xl font-bold text-foreground">
              {preferredCurrency}{formatNumber(displayAmount, 2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {displayUnit}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.activeSubscriptionsLabel")}</p>
              <p className="text-lg font-semibold text-foreground">{activeSubscriptions.length}</p>
            </div>

            {viewMode === "monthly" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("dashboard.comparisonLastMonth")}</p>
                <div className="flex items-center gap-1 justify-end">
                  {isIncrease ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <p className={`text-sm font-semibold ${isIncrease ? "text-red-500" : "text-green-500"}`}>
                    {isIncrease ? "+" : ""}{changePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
