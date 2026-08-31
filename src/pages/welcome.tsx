import { useRouter } from "next/router";
import { BellRing, CheckCircle2, LayoutDashboard } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();
  const count = typeof router.query.count === "string" ? router.query.count : "";

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(105,80,255,0.32),transparent_45%),linear-gradient(135deg,#020617,#16134a)] px-4 text-white">
      <SEO title="พร้อมแล้ว - Submo.ai" description="เริ่มติดตามค่าใช้จ่ายบริการออนไลน์ของคุณ" />
      <main className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-9 w-9" /></div>
        <h1 className="mt-6 text-3xl font-black">เรียบร้อย! เริ่มติดตามได้เลย</h1>
        <p className="mt-3 text-slate-300">เราเพิ่ม {count ? `${count} รายการ` : "รายการของคุณ"} และเปิดเตือนก่อนวันต่ออายุให้แล้ว</p>
        <div className="my-8 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-200"><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" />ดูยอดรวมรายเดือนและรายปีได้ทันที</p><p className="flex items-center gap-3"><BellRing className="h-5 w-5 text-violet-300" />ปรับการแจ้งเตือนได้จากหน้ารายการ</p></div>
        <Button onClick={() => router.push("/dashboard")} className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white"><LayoutDashboard className="mr-2 h-5 w-5" />ไปที่ Dashboard</Button>
      </main>
    </div>
  );
}
