import { useEffect, useState } from "react";
import { Info, TrendingUp, AlertTriangle, Repeat, Scissors, Lightbulb, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface IntelligenceProps {
  amount: string;
  currency: string;
  billingCycle: string;
  categoryId: string;
  usageFrequency?: string;
  existingSubscriptions: Subscription[];
  onRecommendation?: (recommendation: string) => void;
}

interface CostBreakdown {
  monthly: number;
  yearly: number;
  daily: number;
}

interface Insight {
  type: "warning" | "info" | "tip";
  icon: React.ReactNode;
  message: string;
  dismissible: boolean;
}

export function SubscriptionIntelligence({
  amount,
  currency,
  billingCycle,
  categoryId,
  usageFrequency,
  existingSubscriptions,
  onRecommendation,
}: IntelligenceProps) {
  const { t } = useLanguage();
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [spendingContext, setSpendingContext] = useState<{
    percentageOfTotal: number;
    rank: number;
    totalSubscriptions: number;
  } | null>(null);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  // 1️⃣ Real-time Cost Intelligence
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setCostBreakdown(null);
      return;
    }

    const amountNum = parseFloat(amount);
    let monthly = 0;
    let yearly = 0;

    switch (billingCycle) {
      case "monthly":
        monthly = amountNum;
        yearly = amountNum * 12;
        break;
      case "yearly":
        yearly = amountNum;
        monthly = amountNum / 12;
        break;
      case "quarterly":
        monthly = amountNum / 3;
        yearly = amountNum * 4;
        break;
      case "weekly":
        monthly = amountNum * 4.33;
        yearly = amountNum * 52;
        break;
      default:
        monthly = amountNum;
        yearly = amountNum * 12;
    }

    const daily = monthly / 30;

    setCostBreakdown({
      monthly: Math.round(monthly * 100) / 100,
      yearly: Math.round(yearly * 100) / 100,
      daily: Math.round(daily * 100) / 100,
    });
  }, [amount, billingCycle]);

  // 2️⃣ Spending Context Awareness
  useEffect(() => {
    if (!costBreakdown || existingSubscriptions.length === 0) {
      setSpendingContext(null);
      return;
    }

    // Calculate total monthly spending
    const totalMonthly = existingSubscriptions.reduce((sum, sub) => {
      let subMonthly = sub.amount;
      switch (sub.billing_cycle) {
        case "yearly":
          subMonthly = sub.amount / 12;
          break;
        case "quarterly":
          subMonthly = sub.amount / 3;
          break;
        case "weekly":
          subMonthly = sub.amount * 4.33;
          break;
      }
      return sum + subMonthly;
    }, 0);

    const newTotalMonthly = totalMonthly + costBreakdown.monthly;
    const percentage = (costBreakdown.monthly / newTotalMonthly) * 100;

    // Calculate rank
    const monthlyCosts = existingSubscriptions.map((sub) => {
      switch (sub.billing_cycle) {
        case "yearly":
          return sub.amount / 12;
        case "quarterly":
          return sub.amount / 3;
        case "weekly":
          return sub.amount * 4.33;
        default:
          return sub.amount;
      }
    });

    monthlyCosts.push(costBreakdown.monthly);
    monthlyCosts.sort((a, b) => b - a);
    const rank = monthlyCosts.indexOf(costBreakdown.monthly) + 1;

    setSpendingContext({
      percentageOfTotal: Math.round(percentage * 10) / 10,
      rank,
      totalSubscriptions: existingSubscriptions.length + 1,
    });
  }, [costBreakdown, existingSubscriptions]);

  // 3️⃣ Soft Warning & Insight Rules
  useEffect(() => {
    if (!costBreakdown) {
      setInsights([]);
      return;
    }

    const newInsights: Insight[] = [];

    // Rule 1: High yearly cost
    if (costBreakdown.yearly > 10000 && !dismissedInsights.has("high-cost")) {
      newInsights.push({
        type: "warning",
        icon: <AlertTriangle className="h-4 w-4" />,
        message: t("intelligence.highYearlyCost").replace("{amount}", costBreakdown.yearly.toLocaleString()),
        dismissible: true,
      });
    }

    // Rule 2: Multiple subscriptions in same category
    if (categoryId && !dismissedInsights.has("multiple-category")) {
      const sameCategory = existingSubscriptions.filter((sub) => sub.category_id === categoryId);
      if (sameCategory.length >= 2) {
        newInsights.push({
          type: "info",
          icon: <Repeat className="h-4 w-4" />,
          message: t("intelligence.multipleInCategory").replace("{count}", (sameCategory.length + 1).toString()),
          dismissible: true,
        });
      }
    }

    // Rule 3: Rarely used subscription
    if (usageFrequency === "rarely" && !dismissedInsights.has("rarely-used")) {
      newInsights.push({
        type: "tip",
        icon: <Scissors className="h-4 w-4" />,
        message: t("intelligence.rarelyUsed"),
        dismissible: true,
      });
    }

    // 4️⃣ Auto Recommendation Engine
    if (!dismissedInsights.has("recommendation")) {
      // Recommend yearly billing if currently monthly
      if (billingCycle === "monthly" && costBreakdown.yearly > 0) {
        const yearlyDiscount = 10; // Assume 10% discount
        const potentialYearly = costBreakdown.yearly * (1 - yearlyDiscount / 100);
        const savings = costBreakdown.yearly - potentialYearly;
        if (savings > 100) {
          newInsights.push({
            type: "tip",
            icon: <Lightbulb className="h-4 w-4" />,
            message: t("intelligence.yearlyBillingSuggestion").replace("{savings}", savings.toLocaleString()),
            dismissible: true,
          });
        }
      }

      // Recommend reminder for yearly or high cost
      if ((billingCycle === "yearly" || costBreakdown.yearly > 5000) && !dismissedInsights.has("reminder")) {
        newInsights.push({
          type: "info",
          icon: <Info className="h-4 w-4" />,
          message: t("intelligence.reminderSuggestion"),
          dismissible: false,
        });
      }
    }

    setInsights(newInsights);
  }, [costBreakdown, categoryId, usageFrequency, billingCycle, existingSubscriptions, dismissedInsights, t]);

  const dismissInsight = (index: number) => {
    const insight = insights[index];
    const key = insight.message.substring(0, 20); // Use first 20 chars as key
    setDismissedInsights((prev) => new Set(prev).add(key));
  };

  const formatCurrency = (value: number) => {
    return `${currency === "THB" ? "฿" : currency === "USD" ? "$" : ""}${value.toLocaleString()}`;
  };

  if (!costBreakdown) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 1️⃣ Cost Breakdown Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {t("intelligence.costBreakdown")}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Monthly Cost */}
                <div className={billingCycle === "yearly" ? "opacity-100" : "opacity-75"}>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                    {t("intelligence.monthlyEquivalent")}
                  </p>
                  <p className={`text-lg font-bold ${billingCycle === "yearly" ? "text-blue-700 dark:text-blue-300" : "text-blue-600 dark:text-blue-400"}`}>
                    {formatCurrency(costBreakdown.monthly)}
                    <span className="text-xs font-normal ml-1">/month</span>
                  </p>
                </div>

                {/* Yearly Cost */}
                <div className={billingCycle === "monthly" ? "opacity-100" : "opacity-75"}>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                    {t("intelligence.yearlyEquivalent")}
                  </p>
                  <p className={`text-lg font-bold ${billingCycle === "monthly" ? "text-blue-700 dark:text-blue-300" : "text-blue-600 dark:text-blue-400"}`}>
                    {formatCurrency(costBreakdown.yearly)}
                    <span className="text-xs font-normal ml-1">/year</span>
                  </p>
                </div>
              </div>

              {/* Daily Cost - Micro text */}
              <p className="text-xs text-blue-500 dark:text-blue-500">
                {t("intelligence.dailyCost")}: {formatCurrency(costBreakdown.daily)}/day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2️⃣ Spending Context */}
      {spendingContext && (
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  {t("intelligence.spendingContext")}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {spendingContext.percentageOfTotal}% {t("intelligence.ofTotalSpending")}
                  </p>
                  {spendingContext.rank <= 3 && (
                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      {t("intelligence.rank").replace("{rank}", spendingContext.rank.toString()).replace("{total}", spendingContext.totalSubscriptions.toString())}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3️⃣ & 4️⃣ Insights & Recommendations */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <Alert
              key={index}
              className={`relative ${
                insight.type === "warning"
                  ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20"
                  : insight.type === "info"
                  ? "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20"
                  : "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 ${
                    insight.type === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : insight.type === "info"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {insight.icon}
                </div>
                <AlertDescription
                  className={`flex-1 text-sm ${
                    insight.type === "warning"
                      ? "text-amber-800 dark:text-amber-200"
                      : insight.type === "info"
                      ? "text-blue-800 dark:text-blue-200"
                      : "text-green-800 dark:text-green-200"
                  }`}
                >
                  {insight.message}
                </AlertDescription>
                {insight.dismissible && (
                  <button
                    onClick={() => dismissInsight(index)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

// 6️⃣ Intelligence Summary Component (shown before submit)
interface IntelligenceSummaryProps {
  costBreakdown: {
    monthly: number;
    yearly: number;
  };
  spendingPercentage: number;
  reminderEnabled: boolean;
  currency: string;
}

export function IntelligenceSummary({
  costBreakdown,
  spendingPercentage,
  reminderEnabled,
  currency,
}: IntelligenceSummaryProps) {
  const { t } = useLanguage();

  const formatCurrency = (value: number) => {
    return `${currency === "THB" ? "฿" : currency === "USD" ? "$" : ""}${value.toLocaleString()}`;
  };

  return (
    <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
              🧠 {t("intelligence.summary")}
            </h3>
            <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>
                  {t("intelligence.summaryYearlyCost").replace("{amount}", formatCurrency(costBreakdown.yearly))}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>
                  {t("intelligence.summaryPercentage").replace("{percentage}", spendingPercentage.toString())}
                </span>
              </li>
              {reminderEnabled && (
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span>{t("intelligence.summaryReminder")}</span>
                </li>
              )}
            </ul>
            <p className="text-xs text-indigo-500 dark:text-indigo-500 mt-3">
              {t("intelligence.noActionRequired")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}