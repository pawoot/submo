import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { subscriptionService } from "@/services/subscriptionService";
import { subscriptionTemplateService, type SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { AuthGuard } from "@/components/AuthGuard";
import { AddSubscriptionSteps } from "@/components/AddSubscriptionSteps";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function AddSubscription() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popularTemplates, setPopularTemplates] = useState<SubscriptionTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, categoriesData, paymentMethodsData] = await Promise.all([
        subscriptionTemplateService.getPopularTemplates(6),
        subscriptionService.getCategories(),
        subscriptionService.getPaymentMethods()
      ]);
      
      setPopularTemplates(templatesData);
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: t("common.error"),
        description: t("toast.loadError"),
        variant: "destructive",
      });
    }
  };

  const handleTemplateSelect = (template: SubscriptionTemplate) => {
    toast({
      title: t("addSub.templateSelected"),
      description: t("addSub.templateSelectedDesc"),
      duration: 3000,
    });
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find(c => c.id === data.category_id);
      const selectedPaymentMethod = paymentMethods.find(p => p.id === data.payment_method_id);

      await subscriptionService.create({
        name: data.name,
        category_id: data.category_id,
        category: selectedCategory?.slug || "other",
        description: data.description || null,
        amount: Number(data.amount),
        currency: data.currency,
        billing_cycle: data.billing_cycle,
        payment_method_id: data.payment_method_id,
        payment_method: selectedPaymentMethod?.slug || "other",
        card_last_4: data.card_last_4 || null,
        start_date: data.start_date.toISOString(),
        next_billing_date: data.next_billing_date.toISOString(),
        website_url: data.website_url || null,
        notes: data.notes || null,
        is_active: true,
        logo_url: data.icon_url || null, // Map icon_url to logo_url for legacy support
        icon_url: data.icon_url || null, // New field
        is_template: false,
        template_id: data.template_id || null, // Link to parent template
        popularity_score: 0,
        shared_with: [], 
        updated_at: new Date().toISOString()
      });

      toast({
        title: t("common.success"),
        description: t("subscription.add_success"),
      });
      
      router.push("/");
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("common.error_occurred"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <SEO 
        title={t("addSub.title") + " - Submo.ai"}
        description={t("addSub.title") + " - " + t("home.seo.description")}
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
                <p className="text-sm text-slate-600 dark:text-slate-400">{t("addSub.desc")}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <AddSubscriptionSteps
            popularTemplates={popularTemplates}
            categories={categories}
            paymentMethods={paymentMethods}
            onSubmit={handleSubmit}
            onTemplateSelect={handleTemplateSelect}
            isSubmitting={isSubmitting}
          />
        </main>
      </div>
    </AuthGuard>
  );
}