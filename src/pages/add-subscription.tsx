import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { AddSubscriptionWizard } from "@/components/AddSubscriptionWizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscriptionService } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import { getAllCategories } from "@/services/adminCategoryService";
import { getAllPaymentMethods } from "@/services/adminPaymentMethodService";
import { ImportSubscriptionDialog } from "@/components/ImportSubscriptionDialog";
import { CustomerHeader } from "@/components/CustomerHeader";
import { FileUp } from "lucide-react";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function AddSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [existingSubscriptions, setExistingSubscriptions] = useState<any[]>([]); // State for existing subscriptions
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, methods, subs] = await Promise.all([
          getAllCategories(),
          getAllPaymentMethods(),
          subscriptionService.getAll()
        ]);
        setCategories(cats);
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: t("common.error"),
          description: t("common.error_occurred"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast, t]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const newSubscription = {
        name: data.name,
        amount: parseFloat(data.amount),
        currency: data.currency,
        billing_cycle: data.billing_cycle,
        next_billing_date: data.next_billing_date.toISOString(),
        category_id: data.category_id,
        payment_method_id: data.payment_method_id,
        reminder_enabled: data.reminder_enabled,
        reminder_days: data.reminder_days,
        auto_renew: data.auto_renew,
        notes: data.notes,
        icon_url: data.icon_url || null,
        website_url: data.website_url || null,
      };

      await subscriptionService.createSubscription(newSubscription);

      toast({
        title: "✅ สร้างรายการสำเร็จ",
        description: `เพิ่ม "${data.name}" จำนวน ${new Intl.NumberFormat('th-TH', {
          style: 'currency',
          currency: data.currency || 'THB'
        }).format(parseFloat(data.amount))} เรียบร้อยแล้ว`,
        variant: "default",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายการได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SEO 
        title={t("addSub.title") + " - Submo.ai"}
        description={t("addSub.title")}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <CustomerHeader />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("addSub.title")}</h1><p className="text-sm text-slate-600 dark:text-slate-400">{t("addSub.subtitle")}</p></div>
            <ImportSubscriptionDialog trigger={<Button variant="outline" size="sm" className="gap-2"><FileUp className="w-4 h-4" /><span className="hidden sm:inline">Import Statement</span></Button>} onSuccess={() => router.push("/dashboard")} />
          </div>
          <AddSubscriptionWizard
            categories={categories}
            paymentMethods={paymentMethods}
            existingSubscriptions={existingSubscriptions}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
