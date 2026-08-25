import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSubscriptionCosts, type SubscriptionCost } from "@/hooks/useSubscriptionCosts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Bell, Lightbulb, AlertTriangle, Sparkles, X } from "lucide-react";
import { useState } from "react";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface InsightPanelProps {
  subscriptions: Subscription[];
  onToggleReminder?: (id: string, currentEnabled: boolean) => Promise<void>;
}

type InsightType = "high-spending" | "upcoming-renewal" | "savings-opportunity" | "category-duplicate" | "trend" | "reminder-suggestion";

interface Insight {
  type: InsightType;
  message: string;
  priority: 1 | 2 | 3;
  icon: React.ReactNode;
  variant: "default" | "warning" | "success" | "info";
  subscriptionId?: string;
  action?: "enable-reminder" | "view-details";
}

export function InsightPanel({ subscriptions, onToggleReminder }: InsightPanelProps) {
  const { language, t } = useLanguage();
  const { preferredCurrency, formatCurrency } = useCurrency();
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const { costs, isLoading } = useSubscriptionCosts(subscriptions);

  const insights = (isLoading ? [] : generateInsights(
    costs,
    language,
    (amount) => formatCurrency(amount, preferredCurrency),
  ))
    .filter(i => !dismissedInsights.includes(i.message));

  // Separate primary and secondary insights
  const primaryInsight = insights.find(i => i.priority === 1);
  const secondaryInsights = insights.filter(i => i.priority > 1).slice(0, 2);

  const handleDismiss = (message: string) => {
    setDismissedInsights(prev => [...prev, message]);
  };

  if (insights.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {language === "th" ? "ข้อมูลเชิงลึก" : "Submo Insights"}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Primary Insight - Visually Prominent */}
          {primaryInsight && (
            <div className={`
              p-4 rounded-lg border-2 relative
              ${primaryInsight.variant === "warning" ? "border-yellow-500/50 bg-yellow-500/5" : ""}
              ${primaryInsight.variant === "success" ? "border-green-500/50 bg-green-500/5" : ""}
              ${primaryInsight.variant === "info" ? "border-blue-500/50 bg-blue-500/5" : ""}
              ${primaryInsight.variant === "default" ? "border-primary/50 bg-primary/5" : ""}
            `}>
              <button 
                onClick={() => handleDismiss(primaryInsight.message)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-3 h-3" />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {primaryInsight.icon}
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-foreground leading-relaxed mb-2">
                    {primaryInsight.message}
                  </p>
                  
                  {primaryInsight.action === "enable-reminder" && primaryInsight.subscriptionId && onToggleReminder && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs bg-background hover:bg-background/90"
                        onClick={() => onToggleReminder(primaryInsight.subscriptionId!, false)}
                      >
                        <Bell className="w-3 h-3 mr-1.5" />
                        {t("subscriptions.turnOnReminder")}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs"
                        onClick={() => handleDismiss(primaryInsight.message)}
                      >
                        {t("subscriptions.remindLater")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Secondary Insights - Subtle */}
          {secondaryInsights.length > 0 && (
            <div className="space-y-2">
              {secondaryInsights.map((insight, index) => (
                <div key={index} className="group relative flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex-shrink-0 mt-0.5 opacity-70">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.message}
                    </p>
                    
                    {insight.action === "enable-reminder" && insight.subscriptionId && onToggleReminder && (
                       <Button 
                        size="sm" 
                        variant="link" 
                        className="h-auto p-0 text-xs mt-1 text-primary"
                        onClick={() => onToggleReminder(insight.subscriptionId!, false)}
                      >
                        {t("subscriptions.turnOnReminder")}
                      </Button>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDismiss(insight.message)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function generateInsights(
  costs: SubscriptionCost[],
  language: "th" | "en",
  formatMoney: (amount: number) => string,
): Insight[] {
  const insights: Insight[] = [];

  // Calculate total monthly spending
  const totalMonthly = costs.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);

  // Calculate baseline (simple average for now - can be enhanced)
  const baseline = totalMonthly * 0.85; // Assume baseline is 85% of current

  // Calculate previous month (mock - would come from historical data)
  const previousMonth = totalMonthly * 0.88;
  const changePercent = ((totalMonthly - previousMonth) / previousMonth * 100).toFixed(0);

  // Check for subscriptions without reminders
  const noReminderSubs = costs.filter(({ subscription }) => !subscription.reminder_enabled);
  if (noReminderSubs.length > 0) {
    // Pick the most expensive one without reminder
    const expensiveNoReminder = [...noReminderSubs].sort((a, b) => b.yearlyCost - a.yearlyCost)[0];
    
    insights.push({
      type: "reminder-suggestion",
      priority: 1, // High priority to show the button
      variant: "info",
      icon: <Bell className="w-5 h-5 text-blue-500" />,
      message: language === "th"
        ? `คุณยังไม่ได้เปิดแจ้งเตือนสำหรับ ${expensiveNoReminder.subscription.name} ซึ่งมีค่าใช้จ่ายสูง`
        : `You haven't enabled reminders for ${expensiveNoReminder.subscription.name}, which is a high cost item.`,
      subscriptionId: expensiveNoReminder.subscription.id,
      action: "enable-reminder"
    });
  }

  // Priority 1: High spending or trend
  if (totalMonthly > baseline * 1.15) {
    insights.push({
      type: "high-spending",
      priority: 2, // Moved to 2 to let reminder take precedence if exists, or keep as 1
      variant: "warning",
      icon: <TrendingUp className="w-5 h-5 text-yellow-600" />,
      message: language === "th"
        ? `คุณใช้จ่ายมากกว่าค่าเฉลี่ยปกติ (${formatMoney(baseline)})`
        : `You're spending more than your usual average (${formatMoney(baseline)})`
    });
  } else if (Math.abs(parseFloat(changePercent)) >= 10) {
    const isIncrease = parseFloat(changePercent) > 0;
    insights.push({
      type: "trend",
      priority: 1,
      variant: isIncrease ? "warning" : "success",
      icon: isIncrease 
        ? <TrendingUp className="w-5 h-5 text-yellow-600" />
        : <TrendingDown className="w-5 h-5 text-green-600" />,
      message: language === "th"
        ? `การใช้จ่ายของคุณ${isIncrease ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(parseFloat(changePercent))}% จากเดือนที่แล้ว`
        : `Your spending ${isIncrease ? "increased" : "decreased"} by ${Math.abs(parseFloat(changePercent))}% from last month`
    });
  } else {
    insights.push({
      type: "high-spending",
      priority: 1,
      variant: "default",
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      message: language === "th"
        ? `คุณใช้จ่าย ${formatMoney(totalMonthly)} ต่อเดือนสำหรับ Subscriptions`
        : `You spend ${formatMoney(totalMonthly)}/month on subscriptions`
    });
  }

  // Priority 2: Upcoming renewals
  const now = new Date();
  const upcomingSoon = costs.filter(({ subscription }) => {
    if (!subscription.next_billing_date) return false;
    const nextDate = new Date(subscription.next_billing_date);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });

  if (upcomingSoon.length > 0) {
    insights.push({
      type: "upcoming-renewal",
      priority: 2,
      variant: "info",
      icon: <Bell className="w-4 h-4 text-blue-600" />,
      message: language === "th"
        ? `${upcomingSoon.length} บริการจะต่ออายุภายใน 7 วัน`
        : `${upcomingSoon.length} ${upcomingSoon.length === 1 ? "subscription" : "subscriptions"} renewing within 7 days`
    });
  }

  // Priority 3: Savings opportunity (highest cost item)
  const sortedByCost = [...costs].sort((a, b) => b.yearlyCost - a.yearlyCost);

  if (sortedByCost.length > 0 && sortedByCost[0].yearlyCost > 1000) {
    const topSub = sortedByCost[0];
    insights.push({
      type: "savings-opportunity",
      priority: 3,
      variant: "success",
      icon: <Lightbulb className="w-4 h-4 text-green-600" />,
      message: language === "th"
        ? `ยกเลิก ${topSub.subscription.name} สามารถประหยัดได้ ${formatMoney(topSub.yearlyCost)}/ปี`
        : `Canceling ${topSub.subscription.name} could save you ${formatMoney(topSub.yearlyCost)}/year`
    });
  }

  // Priority 3: Category duplicates
  const categoryCount = new Map<string, number>();
  costs.forEach(({ subscription }) => {
    if (subscription.category) {
      categoryCount.set(subscription.category, (categoryCount.get(subscription.category) || 0) + 1);
    }
  });

  const duplicateCategories = Array.from(categoryCount.entries())
    .filter(([, count]) => count > 1);

  if (duplicateCategories.length > 0) {
    const [topCategory, count] = duplicateCategories[0];
    insights.push({
      type: "category-duplicate",
      priority: 3,
      variant: "warning",
      icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      message: language === "th"
        ? `คุณมี ${count} บริการในหมวด ${topCategory}`
        : `You have ${count} subscriptions in ${topCategory}`
    });
  }

  // Sort by priority and return max 3
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
