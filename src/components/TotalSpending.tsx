import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { useSubscriptionCosts } from "@/hooks/useSubscriptionCosts";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface TotalSpendingProps {
  subscriptions: Subscription[];
}

export function TotalSpending({ subscriptions }: TotalSpendingProps) {
  const { t } = useLanguage();
  const { preferredCurrency, formatCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const { costs, isLoading } = useSubscriptionCosts(subscriptions);
  const monthlyTotal = costs.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);
  const yearlyTotal = costs.reduce((sum, subscription) => sum + subscription.yearlyCost, 0);

  const highestCostSubscription = [...costs].sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

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
              {isLoading ? "…" : formatCurrency(displayAmount, preferredCurrency)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {displayUnit}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.activeSubscriptionsLabel")}</p>
              <p className="text-lg font-semibold text-foreground">{costs.length}</p>
            </div>

            {viewMode === "monthly" && highestCostSubscription && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">ค่าใช้จ่ายหลัก</p>
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
