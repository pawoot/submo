import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface InsightPanelProps {
  subscriptions: Subscription[];
  currency: string;
}

export function InsightPanel({ subscriptions, currency }: InsightPanelProps) {
  const { t, language } = useLanguage();

  // Calculate insights
  const insights = generateInsights(subscriptions, currency, language);

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
            💡 {language === "th" ? "ข้อมูลเชิงลึกของคุณ" : "Your Insights"}
          </h2>
        </div>

        <div className="space-y-3">
          {insights.slice(0, 3).map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
            >
              <div className="flex-shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {insight.message}
                </p>
                {insight.subtext && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {insight.subtext}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface Insight {
  message: string;
  subtext?: string;
  icon: React.ReactNode;
  priority: number;
}

function generateInsights(
  subscriptions: Subscription[],
  currency: string,
  language: string
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // Calculate current month spending
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const currentMonthSpending = subscriptions.reduce((sum, sub) => {
    if (!sub.amount) return sum;
    
    const nextBilling = new Date(sub.next_billing_date);
    if (nextBilling.getMonth() === currentMonth && nextBilling.getFullYear() === currentYear) {
      const monthlyAmount = sub.billing_cycle === "yearly" 
        ? sub.amount / 12 
        : sub.amount;
      return sum + monthlyAmount;
    }
    return sum;
  }, 0);

  // Get previous month for comparison
  const lastMonth = new Date(currentYear, currentMonth - 1, 1);
  const previousMonthSpending = subscriptions.reduce((sum, sub) => {
    if (!sub.amount) return sum;
    
    const nextBilling = new Date(sub.next_billing_date);
    if (nextBilling.getMonth() === lastMonth.getMonth() && 
        nextBilling.getFullYear() === lastMonth.getFullYear()) {
      const monthlyAmount = sub.billing_cycle === "yearly" 
        ? sub.amount / 12 
        : sub.amount;
      return sum + monthlyAmount;
    }
    return sum;
  }, 0);

  // Insight 1: Current month spending with trend
  if (currentMonthSpending > 0) {
    const percentChange = previousMonthSpending > 0
      ? ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100
      : 0;

    const isIncrease = percentChange > 5;
    const isDecrease = percentChange < -5;

    let message = "";
    let icon = <CheckCircle className="w-5 h-5 text-green-600" />;

    if (language === "th") {
      if (isIncrease) {
        message = `คุณใช้จ่าย ${currency}${currentMonthSpending.toLocaleString()} ในเดือนนี้ (+${percentChange.toFixed(0)}% จากเดือนที่แล้ว)`;
        icon = <TrendingUp className="w-5 h-5 text-orange-600" />;
      } else if (isDecrease) {
        message = `คุณใช้จ่าย ${currency}${currentMonthSpending.toLocaleString()} ในเดือนนี้ (${percentChange.toFixed(0)}% จากเดือนที่แล้ว)`;
        icon = <TrendingDown className="w-5 h-5 text-green-600" />;
      } else {
        message = `คุณใช้จ่าย ${currency}${currentMonthSpending.toLocaleString()} ในเดือนนี้`;
      }
    } else {
      if (isIncrease) {
        message = `You spent ${currency}${currentMonthSpending.toLocaleString()} this month (+${percentChange.toFixed(0)}% from last month)`;
        icon = <TrendingUp className="w-5 h-5 text-orange-600" />;
      } else if (isDecrease) {
        message = `You spent ${currency}${currentMonthSpending.toLocaleString()} this month (${percentChange.toFixed(0)}% from last month)`;
        icon = <TrendingDown className="w-5 h-5 text-green-600" />;
      } else {
        message = `You spent ${currency}${currentMonthSpending.toLocaleString()} this month`;
      }
    }

    insights.push({
      message,
      icon,
      priority: 1
    });
  }

  // Insight 2: Upcoming renewals in next 7 days
  const upcomingRenewals = subscriptions.filter(sub => {
    const nextBilling = new Date(sub.next_billing_date);
    const daysUntil = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });

  if (upcomingRenewals.length > 0) {
    const message = language === "th"
      ? `${upcomingRenewals.length} subscription จะต่ออายุภายใน 7 วันข้างหน้า`
      : `${upcomingRenewals.length} subscription${upcomingRenewals.length > 1 ? "s" : ""} will renew within the next 7 days`;

    insights.push({
      message,
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      priority: 2
    });
  }

  // Insight 3: Biggest saving opportunity
  const sortedByYearlyCost = [...subscriptions]
    .filter(sub => sub.amount)
    .sort((a, b) => {
      const aYearly = a.billing_cycle === "yearly" ? a.amount! : a.amount! * 12;
      const bYearly = b.billing_cycle === "yearly" ? b.amount! : b.amount! * 12;
      return bYearly - aYearly;
    });

  if (sortedByYearlyCost.length > 0 && sortedByYearlyCost[0].amount) {
    const topSub = sortedByYearlyCost[0];
    const yearlyCost = topSub.billing_cycle === "yearly" 
      ? topSub.amount 
      : topSub.amount * 12;

    const message = language === "th"
      ? `ยกเลิก ${topSub.name} จะช่วยประหยัด ${currency}${yearlyCost.toLocaleString()} ต่อปี`
      : `Canceling ${topSub.name} could save you ${currency}${yearlyCost.toLocaleString()} per year`;

    insights.push({
      message,
      subtext: language === "th" ? "บริการที่มีค่าใช้จ่ายสูงสุดของคุณ" : "Your most expensive service",
      icon: <TrendingDown className="w-5 h-5 text-green-600" />,
      priority: 3
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}