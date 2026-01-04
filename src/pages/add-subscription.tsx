import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
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

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function AddSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, paymentMethodsData] = await Promise.all([
          supabase.from("categories").select("*").order("name_en"),
          supabase.from("payment_methods").select("*").order("name_en")
        ]);

        if (categoriesData.error) throw categoriesData.error;
        if (paymentMethodsData.error) throw paymentMethodsData.error;

        setCategories(categoriesData.data || []);
        setPaymentMethods(paymentMethodsData.data || []);
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
      await subscriptionService.create({
        name: data.name,
        category_id: data.category_id,
        category: categories.find(c => c.id === data.category_id)?.slug || "other",
        description: null,
        amount: data.amount,
        currency: data.currency,
        billing_cycle: data.billing_cycle,
        payment_method_id: data.payment_method_id,
        payment_method: paymentMethods.find(p => p.id === data.payment_method_id)?.slug || "other",
        card_last_4: data.card_last_4 || null,
        start_date: data.start_date.toISOString(),
        next_billing_date: data.next_billing_date.toISOString(),
        notes: data.notes || null,
        shared_with: data.shared_with || [],
        template_id: data.template_id,
        icon_url: data.icon_url,
        logo_url: data.icon_url,
        is_template: false,
        is_active: true,
        popularity_score: 0,
        remind_3_days_before: data.remind_3_days,
        remind_7_days_before: data.remind_7_days,
        usage_frequency: data.usage_frequency || null,
        website_url: null,
        updated_at: new Date().toISOString(),
        usage_count: 0
      });

      toast({
        title: t("common.success"),
        description: t("subscription.add_success"),
      });

      router.push("/");
    } catch (error) {
      console.error("Error adding subscription:", error);
      toast({
        title: t("common.error"),
        description: t("common.error_occurred"),
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
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("addSub.title")}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t("addSub.subtitle")}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <AddSubscriptionWizard
            categories={categories}
            paymentMethods={paymentMethods}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </main>
      </div>
    </AuthGuard>
  );
}