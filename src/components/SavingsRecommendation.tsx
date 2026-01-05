import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Eye, Clock, Bell } from "lucide-react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface SavingsRecommendationProps {
  subscriptions: Subscription[];
  onToggleReminder?: (id: string, currentEnabled: boolean) => Promise<void>;
}

type RecommendationType = "high-cost" | "duplicate-category" | "rarely-used";

interface Recommendation {
  subscription: Subscription;
  reason: RecommendationType;
  monthlyCost: number;
  yearlyCost: number;
  reasonText: string;
}

export function SavingsRecommendation({ subscriptions, onToggleReminder }: SavingsRecommendationProps) {
  const { language } = useLanguage();
  const { preferredCurrency } = useCurrency();
  const router = useRouter();
  const { toast } = useToast();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const t = (key: string) => {
    const translations: Record<string, { th: string; en: string }> = {
      title: { th: "💡 วิธีประหยัดเงิน", en: "💡 Ways to Save Money" },
      highCost: { th: "ค่าใช้จ่ายสูง", en: "High Cost" },
      duplicate: { th: "หมวดหมู่ซ้ำ", en: "Duplicate Category" },
      rarelyUsed: { th: "ใช้ไม่บ่อย", en: "Rarely Used" },
      review: { th: "ดูรายละเอียด", en: "Review" },
      remindLater: { th: "เตือนภายหลัง", en: "Remind Later" },
      enableReminder: { th: "เปิดการแจ้งเตือน", en: "Enable Reminder" },
      month: { th: "เดือน", en: "month" },
      year: { th: "ปี", en: "year" },
      noRecommendations: { th: "ไม่มีคำแนะนำในขณะนี้", en: "No recommendations at this time" },
      reminderEnabled: { th: "เปิดการแจ้งเตือนแล้ว", en: "Reminder enabled" },
      remindedLater: { th: "จะเตือนคุณในภายหลัง", en: "Will remind you later" }
    };
    return translations[key]?.[language] || key;
  };

  const recommendations = generateRecommendations(subscriptions, preferredCurrency, language)
    .filter(rec => !dismissedIds.includes(rec.subscription.id))
    .slice(0, 3); // Limit to top 3

  const handleEnableReminder = async (subId: string) => {
    if (onToggleReminder) {
      await onToggleReminder(subId, false);
    } else {
      toast({
        title: t("reminderEnabled"),
        description: language === "th" ? "คุณจะได้รับการแจ้งเตือนก่อนวันต่ออายุ" : "You'll receive a notification before renewal",
      });
    }
  };

  const handleRemindLater = (subId: string) => {
    setDismissedIds(prev => [...prev, subId]);
    toast({
      title: t("remindedLater"),
      description: language === "th" ? "เราจะแสดงคำแนะนำนี้อีกครั้งในภายหลัง" : "We'll show this recommendation again later",
    });
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 via-background to-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-green-600" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.subscription.id}
            className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
          >
            <div className="flex items-start gap-3">
              {/* Icon or Logo */}
              <div className="flex-shrink-0">
                {rec.subscription.icon_url ? (
                  <img
                    src={rec.subscription.icon_url}
                    alt={rec.subscription.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xl">{getReasonIcon(rec.reason)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-foreground truncate">{rec.subscription.name}</h4>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {getReasonBadgeText(rec.reason, language)}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {rec.reasonText}
                </p>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="font-medium text-foreground">
                    {preferredCurrency}{rec.monthlyCost.toFixed(0)}/{t("month")}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {preferredCurrency}{rec.yearlyCost.toFixed(0)}/{t("year")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/edit-subscription/${rec.subscription.id}`)}
                    className="gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("review")}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEnableReminder(rec.subscription.id)}
                    className="gap-2"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {t("enableReminder")}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemindLater(rec.subscription.id)}
                    className="gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t("remindLater")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function generateRecommendations(
  subscriptions: Subscription[],
  preferredCurrency: string,
  language: "th" | "en"
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Calculate costs for all subscriptions
  const subsWithCosts = subscriptions.map(sub => {
    // Amount is already converted
    const monthlyCost = sub.billing_cycle === "yearly" 
      ? (sub.amount / 12)
      : sub.amount;
    const yearlyCost = sub.billing_cycle === "yearly" 
      ? sub.amount
      : sub.amount * 12;
    return { ...sub, monthlyCost, yearlyCost };
  });

  // Calculate total monthly spending
  const totalMonthly = subsWithCosts.reduce((sum, sub) => sum + sub.monthlyCost, 0);

  // Find high-cost subscriptions (top 30% or > 20% of total)
  const sorted = [...subsWithCosts].sort((a, b) => b.yearlyCost - a.yearlyCost);
  const top30PercentCount = Math.max(1, Math.ceil(sorted.length * 0.3));

  sorted.slice(0, top30PercentCount).forEach(sub => {
    const percentOfTotal = (sub.monthlyCost / totalMonthly) * 100;
    if (percentOfTotal > 20 || sub.yearlyCost > 3000) {
      recommendations.push({
        subscription: sub,
        reason: "high-cost",
        monthlyCost: sub.monthlyCost,
        yearlyCost: sub.yearlyCost,
        reasonText: language === "th"
          ? `คิดเป็น ${percentOfTotal.toFixed(0)}% ของค่าใช้จ่ายรวม`
          : `Represents ${percentOfTotal.toFixed(0)}% of your total spending`
      });
    }
  });

  // Find duplicate categories
  const categoryMap = new Map<string, typeof subsWithCosts>();
  subsWithCosts.forEach(sub => {
    if (sub.category) {
      const existing = categoryMap.get(sub.category) || [];
      categoryMap.set(sub.category, [...existing, sub]);
    }
  });

  categoryMap.forEach((subs, category) => {
    if (subs.length > 1) {
      // Add all but the most expensive one
      const sortedSubs = [...subs].sort((a, b) => b.yearlyCost - a.yearlyCost);
      sortedSubs.slice(1).forEach(sub => {
        // Avoid duplicates
        if (!recommendations.find(r => r.subscription.id === sub.id)) {
          recommendations.push({
            subscription: sub,
            reason: "duplicate-category",
            monthlyCost: sub.monthlyCost,
            yearlyCost: sub.yearlyCost,
            reasonText: language === "th"
              ? `คุณมี ${subs.length} บริการในหมวด ${category}`
              : `You have ${subs.length} subscriptions in ${category}`
          });
        }
      });
    }
  });

  // Sort by potential savings (yearly cost)
  return recommendations.sort((a, b) => b.yearlyCost - a.yearlyCost);
}

function getReasonBadgeText(reason: RecommendationType, language: "th" | "en"): string {
  const badges = {
    "high-cost": { th: "ค่าใช้จ่ายสูง", en: "High Cost" },
    "duplicate-category": { th: "หมวดหมู่ซ้ำ", en: "Duplicate" },
    "rarely-used": { th: "ใช้ไม่บ่อย", en: "Rarely Used" }
  };
  return badges[reason][language];
}

function getReasonIcon(reason: RecommendationType): string {
  switch (reason) {
    case "high-cost":
      return "🟡";
    case "duplicate-category":
      return "⚠️";
    case "rarely-used":
      return "💤";
    default:
      return "ℹ️";
  }
}