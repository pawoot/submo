import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { subscriptionService } from "@/services/subscriptionService";

const RAW_DRAFT_KEY = "submo-onboarding-draft";
const CONFIRMED_DRAFT_KEY = "submo-onboarding-confirmed";

type DraftSubscription = {
  id: string;
  name: string;
  amount: string;
  currency: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
};

const SERVICE_DEFAULTS: Array<Omit<DraftSubscription, "id" | "nextBillingDate"> & { keywords: string[] }> = [
  { name: "ChatGPT Plus", amount: "20", currency: "USD", billingCycle: "monthly", keywords: ["chatgpt"] },
  { name: "Netflix", amount: "499", currency: "THB", billingCycle: "monthly", keywords: ["netflix"] },
  { name: "Google One", amount: "125", currency: "THB", billingCycle: "monthly", keywords: ["google one", "googleone"] },
  { name: "Spotify", amount: "139", currency: "THB", billingCycle: "monthly", keywords: ["spotify"] },
  { name: "YouTube Premium", amount: "179", currency: "THB", billingCycle: "monthly", keywords: ["youtube", "youtube premium"] },
];

const nextMonthDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
};

const createDraft = (name: string, defaults?: Omit<DraftSubscription, "id" | "nextBillingDate">): DraftSubscription => ({
  id: `${name}-${Math.random().toString(36).slice(2)}`,
  name,
  amount: defaults?.amount ?? "",
  currency: defaults?.currency ?? "THB",
  billingCycle: defaults?.billingCycle ?? "monthly",
  nextBillingDate: nextMonthDate(),
});

const extractServices = (raw: string) => {
  const normalized = raw.toLowerCase();
  const recognized = SERVICE_DEFAULTS
    .filter((service) => service.keywords.some((keyword) => normalized.includes(keyword)))
    .map((service) => createDraft(service.name, service));

  if (recognized.length) return recognized;

  return raw
    .split(/[,;\n]+/)
    .map((name) => name.replace(/^(ใช้|สมัคร|บริการ|i use|subscribe to)\s*/i, "").trim())
    .filter(Boolean)
    .map((name) => createDraft(name));
};

export default function ConfirmSubscriptionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<DraftSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedDetails = localStorage.getItem(CONFIRMED_DRAFT_KEY);
    const rawDraft = localStorage.getItem(RAW_DRAFT_KEY) || "";

    try {
      const parsed = savedDetails ? JSON.parse(savedDetails) as DraftSubscription[] : null;
      setItems(parsed?.length ? parsed : extractServices(rawDraft));
    } catch {
      setItems(extractServices(rawDraft));
    } finally {
      setLoading(false);
    }
  }, []);

  const monthlyEstimate = useMemo(() => items.reduce((total, item) => {
    const amount = Number(item.amount) || 0;
    return total + (item.billingCycle === "yearly" ? amount / 12 : amount);
  }, 0), [items]);

  const updateItem = (id: string, field: keyof DraftSubscription, value: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const saveDraft = (nextItems = items) => {
    localStorage.setItem(CONFIRMED_DRAFT_KEY, JSON.stringify(nextItems));
  };

  const continueToSave = async () => {
    if (!items.length) {
      setMessage("เพิ่มอย่างน้อย 1 บริการก่อนดำเนินการต่อ");
      return;
    }
    if (items.some((item) => !item.name.trim() || Number(item.amount) <= 0 || !item.nextBillingDate)) {
      setMessage("กรุณากรอกราคาและวันต่ออายุของทุกรายการให้ครบ");
      return;
    }

    saveDraft();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/signup?next=%2Fconfirm-subscriptions");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const [categories, paymentMethods] = await Promise.all([
        subscriptionService.getCategories(),
        subscriptionService.getPaymentMethods(),
      ]);
      const defaultCategory = categories.find((category) => ["ai", "software", "other"].includes(category.slug)) || categories[0];
      if (!defaultCategory) throw new Error("No category is configured");

      await Promise.all(items.map((item) => subscriptionService.createSubscription({
        name: item.name.trim(),
        amount: Number(item.amount),
        currency: item.currency,
        billing_cycle: item.billingCycle,
        next_billing_date: new Date(`${item.nextBillingDate}T09:00:00`).toISOString(),
        category_id: defaultCategory.id,
        payment_method_id: paymentMethods[0]?.id || null,
        reminder_enabled: true,
        reminder_days: 3,
        auto_renew: true,
        notes: "Added from quick setup",
      })));

      localStorage.removeItem(RAW_DRAFT_KEY);
      localStorage.removeItem(CONFIRMED_DRAFT_KEY);
      router.push(`/welcome?count=${items.length}`);
    } catch (error) {
      console.error("Quick setup save failed:", error);
      setMessage("บันทึกรายการไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-violet-300" /></div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(112,68,255,0.28),transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#1e1b4b)] px-4 py-8 text-white sm:py-12">
      <SEO title="ยืนยันรายละเอียดบริการ - Submo.ai" description="ตรวจสอบราคาและวันต่ออายุของบริการที่คุณใช้" />
      <main className="mx-auto max-w-4xl">
        <button type="button" onClick={() => router.push("/")} className="mb-7 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" />กลับหน้าแรก</button>
        <div className="mb-8 text-center">
          <p className="mb-3 inline-flex rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">ขั้นตอน 1 จาก 2 · ยืนยันรายละเอียด</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">ตรวจสอบบริการของคุณก่อนบันทึก</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">เราแยกรายชื่อที่คุณบอกไว้ให้แล้ว เติมราคา สกุลเงิน รอบจ่าย และวันต่ออายุได้เลย</p>
        </div>

        <Card className="border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 sm:p-7">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-violet-200">บริการ {index + 1}</span><button type="button" onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-300" aria-label={`ลบ ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor={`name-${item.id}`} className="text-slate-200">ชื่อบริการ</Label><Input id={`name-${item.id}`} value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} className="border-white/10 bg-slate-950/70 text-white" /></div>
                  <div className="space-y-2"><Label htmlFor={`amount-${item.id}`} className="text-slate-200">ราคา</Label><Input id={`amount-${item.id}`} inputMode="decimal" value={item.amount} onChange={(event) => updateItem(item.id, "amount", event.target.value)} placeholder="เช่น 499" className="border-white/10 bg-slate-950/70 text-white" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">สกุลเงิน</Label><Select value={item.currency} onValueChange={(value) => updateItem(item.id, "currency", value)}><SelectTrigger className="border-white/10 bg-slate-950/70 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="THB">THB (฿)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-slate-200">รอบการจ่าย</Label><Select value={item.billingCycle} onValueChange={(value) => updateItem(item.id, "billingCycle", value)}><SelectTrigger className="border-white/10 bg-slate-950/70 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">ต่อเดือน</SelectItem><SelectItem value="yearly">ต่อปี</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor={`date-${item.id}`} className="text-slate-200">วันต่ออายุครั้งถัดไป</Label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input id={`date-${item.id}`} type="date" value={item.nextBillingDate} onChange={(event) => updateItem(item.id, "nextBillingDate", event.target.value)} className="border-white/10 bg-slate-950/70 pl-9 text-white" /></div></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, createDraft("")])} className="w-full border-dashed border-violet-300/40 bg-transparent text-violet-100 hover:bg-violet-500/10"><Plus className="mr-2 h-4 w-4" />เพิ่มบริการอีกรายการ</Button>
          </CardContent>
        </Card>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-2 font-semibold"><CircleDollarSign className="h-5 w-5 text-blue-300" />ยอดประมาณการต่อเดือน</p><p className="mt-1 text-sm text-slate-300">คิดเฉพาะรายการที่ใช้สกุลเงินเดียวกันเพื่อเป็นภาพรวมเบื้องต้น</p></div>
          <p className="text-3xl font-black text-blue-200">{monthlyEstimate.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</p>
        </div>
        {message && <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{message}</p>}
        <Button onClick={continueToSave} disabled={saving} className="mt-6 h-13 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-base font-bold text-white hover:from-blue-400 hover:to-violet-500">{saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />กำลังบันทึก…</> : <><CheckCircle2 className="mr-2 h-5 w-5" />ยืนยันและบันทึกรายการ</>}</Button>
        <p className="mt-3 text-center text-xs text-slate-400">ยังไม่เข้าสู่ระบบ? เราจะให้คุณเข้าสู่ระบบหลังจากตรวจสอบรายละเอียดเสร็จแล้ว</p>
      </main>
    </div>
  );
}
