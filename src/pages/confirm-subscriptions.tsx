import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { subscriptionService } from "@/services/subscriptionService";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";

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

const getServiceCategory = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("netflix") || normalized.includes("youtube")) return "Streaming";
  if (normalized.includes("spotify")) return "Music";
  if (normalized.includes("google one")) return "Cloud storage";
  if (normalized.includes("chatgpt") || normalized.includes("claude")) return "AI และเครื่องมือทำงาน";
  return "บริการออนไลน์";
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

  const monthlyTotals = useMemo(() => items.reduce<Record<string, number>>((totals, item) => {
    const amount = Number(item.amount) || 0;
    totals[item.currency] = (totals[item.currency] || 0) + (item.billingCycle === "yearly" ? amount / 12 : amount);
    return totals;
  }, {}), [items]);

  const formattedTotals = Object.entries(monthlyTotals).map(([currency, amount]) => new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "THB" ? 0 : 2,
  }).format(amount));

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
    <div className="min-h-screen bg-[#050b1b] text-white">
      <SEO title="ยืนยันรายละเอียดบริการ - Submo.ai" description="ตรวจสอบราคาและวันต่ออายุของบริการที่คุณใช้" />
      <header className="border-b border-white/10 bg-[#0c1a35]">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button type="button" onClick={() => router.push("/")} className="flex items-center gap-3 text-left"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black">S</span><span className="text-2xl font-bold tracking-tight text-blue-300">Submo.ai</span></button>
          <ol className="hidden items-center gap-3 text-sm text-slate-400 sm:flex"><li className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500 font-semibold text-white">1</li><span className="h-px w-10 bg-slate-600" /><li className="grid h-9 w-9 place-items-center rounded-full bg-slate-800">2</li><span className="h-px w-10 bg-slate-600" /><li className="grid h-9 w-9 place-items-center rounded-full bg-slate-800">3</li></ol>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <button type="button" onClick={() => router.push("/")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />กลับไปแก้รายชื่อ</button>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">เราเจอ {items.length} บริการของคุณ</h1>
        <p className="mt-3 text-lg text-slate-300">ยืนยันเฉพาะราคาและวันต่ออายุ ระบบใส่ชื่อ หมวดหมู่ และไอคอนให้แล้ว</p>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-400/15 px-5 py-4 text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0" /><span>เลือกค่าเริ่มต้นให้แล้ว — แก้ไขหรือลบรายการออกได้ก่อนบันทึก</span></div>

        <section className="mt-5 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-4 rounded-3xl border border-blue-200/20 bg-[#0d1c37] p-5 shadow-lg shadow-black/10 lg:grid-cols-[minmax(220px,1fr)_105px_110px_150px_200px_32px] lg:items-center lg:gap-3">
              <div className="flex min-w-0 items-center gap-4"><SubscriptionIcon name={item.name} size="md" className="shrink-0 border-0" /><div className="min-w-0"><Input aria-label="ชื่อบริการ" value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} className="h-8 border-0 bg-transparent px-0 text-lg font-semibold text-white shadow-none focus-visible:ring-0" /><p className="mt-1 text-sm text-slate-400">{getServiceCategory(item.name)}</p></div></div>
              <div><Label className="mb-2 block text-xs text-slate-400 lg:hidden">ราคา</Label><Input aria-label="ราคา" inputMode="decimal" value={item.amount} onChange={(event) => updateItem(item.id, "amount", event.target.value)} placeholder="0" className="border-blue-200/20 bg-[#172a4b] text-white" /></div>
              <div><Label className="mb-2 block text-xs text-slate-400 lg:hidden">สกุลเงิน</Label><Select value={item.currency} onValueChange={(value) => updateItem(item.id, "currency", value)}><SelectTrigger className="border-blue-200/20 bg-[#172a4b] text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="THB">THB</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select></div>
              <div><Label className="mb-2 block text-xs text-slate-400 lg:hidden">รอบการจ่าย</Label><Select value={item.billingCycle} onValueChange={(value) => updateItem(item.id, "billingCycle", value)}><SelectTrigger className="border-blue-200/20 bg-[#172a4b] text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">รายเดือน</SelectItem><SelectItem value="yearly">รายปี</SelectItem></SelectContent></Select></div>
              <div><Label className="mb-2 block text-xs text-slate-400 lg:hidden">วันต่ออายุ</Label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input aria-label="วันต่ออายุ" type="date" value={item.nextBillingDate} onChange={(event) => updateItem(item.id, "nextBillingDate", event.target.value)} className="border-blue-200/20 bg-[#172a4b] pl-9 text-white" /></div></div>
              <button type="button" onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))} className="justify-self-end rounded-lg p-2 text-slate-500 transition hover:bg-red-500/15 hover:text-red-300" aria-label={`ลบ ${item.name}`}><Trash2 className="h-4 w-4" /></button>
            </article>
          ))}
        </section>

        <button type="button" onClick={() => setItems((current) => [...current, createDraft("")])} className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-xl border border-dashed border-violet-300/45 bg-[#0d1c37]/50 font-semibold text-slate-100 transition hover:border-violet-200 hover:bg-violet-500/10"><Plus className="h-5 w-5" />เพิ่มบริการอีกรายการ</button>

        <section className="mt-7 flex flex-col gap-4 rounded-3xl border border-blue-300/25 bg-gradient-to-r from-[#142a50] to-[#202354] px-6 py-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-3 text-xl font-bold"><CircleDollarSign className="h-6 w-6 text-blue-300" />ยอดประมาณการต่อเดือน</p><p className="mt-1 text-slate-300">รวมตามสกุลเงินที่คุณเลือกไว้</p></div><p className="text-3xl font-black text-blue-200 sm:text-4xl">{formattedTotals.length ? formattedTotals.join(" · ") : "—"}</p></section>

        {message && <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{message}</p>}
        <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row"><p className="text-sm text-slate-400">บันทึกทีเดียว แล้วค่อยเติมรายละเอียดอื่นภายหลังได้</p><Button onClick={continueToSave} disabled={saving} className="h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-7 text-base font-bold text-white hover:from-blue-400 hover:to-indigo-400">{saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />กำลังบันทึก…</> : <>บันทึก {items.length} รายการ<ArrowRight className="ml-2 h-5 w-5" /></>}</Button></div>
      </main>
    </div>
  );
}
