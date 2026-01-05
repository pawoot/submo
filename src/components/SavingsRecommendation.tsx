import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { AlertTriangle, DollarSign, Copy, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

type SubscriptionWithCosts = Subscription & {
  monthlyCost: number;
  yearlyCost: number;
};

interface SavingsRecommendationProps {
  subscriptions: Subscription[];
  currency: string;
}

interface Recommendation {
  subscription: Subscription;
  reason: string;
  reasonType: "expensive" | "duplicate" | "rarely-used" | "multiple-category";
  yearlyCost: number;
  monthlyCost: number;
}

export function SavingsRecommendation({ subscriptions, currency }: SavingsRecommendationProps) {
  const { t, language } = useLanguage();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const recommendations = generateRecommendations(subscriptions, language);
  const visibleRecommendations = recommendations.filter(
    rec => !dismissedIds.includes(rec.subscription.id)
  );

  if (visibleRecommendations.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <DollarSign className="w-6 h-6" />
          💡 {language === "th" ? "วิธีประหยัดเงิน" : "Ways to Save Money"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleRecommendations.slice(0, 5).map((rec) => (
            <div
              key={rec.subscription.id}
              className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {rec.subscription.name}
                  </h3>
                  <Badge variant={getBadgeVariant(rec.reasonType)} className="text-xs">
                    {getReasonIcon(rec.reasonType)} {rec.reason}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                  <span>
                    {currency}{rec.monthlyCost.toLocaleString()}/{language === "th" ? "เดือน" : "month"}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {currency}{rec.yearlyCost.toLocaleString()}/{language === "th" ? "ปี" : "year"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/edit-subscription/${rec.subscription.id}`}>
                    <Button size="sm" variant="outline">
                      {language === "th" ? "ตรวจสอบ" : "Review"}
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(rec.subscription.id)}
                  >
                    {language === "th" ? "เตือนภายหลัง" : "Remind later"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {visibleRecommendations.length > 5 && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 text-center">
            {language === "th" 
              ? `และอีก ${visibleRecommendations.length - 5} คำแนะนำ...` 
              : `And ${visibleRecommendations.length - 5} more recommendations...`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function generateRecommendations(
  subscriptions: Subscription[],
  language: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Calculate monthly costs for all subscriptions
  const subsWithCosts: SubscriptionWithCosts[] = subscriptions
    .filter(sub => sub.amount !== null)
    .map(sub => ({
      ...sub,
      monthlyCost: sub.billing_cycle === "yearly" ? sub.amount! / 12 : sub.amount!,
      yearlyCost: sub.billing_cycle === "yearly" ? sub.amount! : sub.amount! * 12
    }));

  // Sort by yearly cost
  const sorted = [...subsWithCosts].sort((a, b) => b.yearlyCost - a.yearlyCost);

  // Find top 30% most expensive
  const top30Index = Math.ceil(sorted.length * 0.3);
  const expensiveSubs = sorted.slice(0, Math.max(1, top30Index));

  expensiveSubs.forEach(sub => {
    recommendations.push({
      subscription: sub,
      reason: language === "th" ? "ค่าใช้จ่ายสูง" : "High cost",
      reasonType: "expensive",
      monthlyCost: sub.monthlyCost,
      yearlyCost: sub.yearlyCost
    });
  });

  // Find duplicate categories
  const categoryCount = new Map<string, SubscriptionWithCosts[]>();
  subsWithCosts.forEach(sub => {
    if (sub.category) {
      const existing = categoryCount.get(sub.category) || [];
      categoryCount.set(sub.category, [...existing, sub]);
    }
  });

  categoryCount.forEach((subs, category) => {
    if (subs.length >= 2) {
      subs.forEach(sub => {
        if (!recommendations.find(r => r.subscription.id === sub.id)) {
          recommendations.push({
            subscription: sub,
            reason: language === "th" 
              ? `มีหลายบริการในหมวด ${category}` 
              : `Multiple ${category} services`,
            reasonType: "multiple-category",
            monthlyCost: sub.monthlyCost,
            yearlyCost: sub.yearlyCost
          });
        }
      });
    }
  });

  // Find rarely used (placeholder logic - would need usage tracking)
  subsWithCosts.forEach(sub => {
    if (sub.notes?.toLowerCase().includes("rarely") || 
        sub.notes?.toLowerCase().includes("ไม่ค่อยใช้")) {
      if (!recommendations.find(r => r.subscription.id === sub.id)) {
        recommendations.push({
          subscription: sub,
          reason: language === "th" ? "ใช้งานไม่บ่อย" : "Rarely used",
          reasonType: "rarely-used",
          monthlyCost: sub.monthlyCost,
          yearlyCost: sub.yearlyCost
        });
      }
    }
  });

  // Sort by yearly cost descending
  return recommendations.sort((a, b) => b.yearlyCost - a.yearlyCost);
}

function getBadgeVariant(type: string): "destructive" | "secondary" | "outline" {
  switch (type) {
    case "expensive":
      return "destructive";
    case "duplicate":
    case "multiple-category":
      return "secondary";
    case "rarely-used":
      return "outline";
    default:
      return "outline";
  }
}

function getReasonIcon(type: string): string {
  switch (type) {
    case "expensive":
      return "🔴";
    case "duplicate":
    case "multiple-category":
      return "⚠️";
    case "rarely-used":
      return "💤";
    default:
      return "ℹ️";
  }
}