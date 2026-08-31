import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { BarChart3, Check, Eye, EyeOff, Mail, ShieldCheck, UserMinus, UserPlus, Users, X } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { CustomerHeader } from "@/components/CustomerHeader";
import { SEO } from "@/components/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { friendService, type FriendOverview } from "@/services/friendService";
import { toast } from "@/hooks/use-toast";

const friendInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "F";

export default function FriendsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { preferredCurrency, formatCurrency } = useCurrency();
  const [friends, setFriends] = useState<FriendOverview[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try { setFriends(await friendService.getOverviews()); }
    catch (error) { console.error(error); toast({ title: language === "th" ? "โหลดเพื่อนไม่สำเร็จ" : "Could not load friends", variant: "destructive" }); }
    finally { setLoading(false); }
  }, [language]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const incoming = useMemo(() => friends.filter((friend) => friend.relationship_status === "pending" && friend.is_incoming), [friends]);
  const outgoing = useMemo(() => friends.filter((friend) => friend.relationship_status === "pending" && !friend.is_incoming), [friends]);
  const accepted = useMemo(() => friends.filter((friend) => friend.relationship_status === "accepted"), [friends]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    setSending(true);
    try {
      await friendService.inviteByEmail(email);
      const deliveryEmail = email;
      setEmail("");
      try { await friendService.sendInviteEmail(deliveryEmail); }
      catch { toast({ title: language === "th" ? "บันทึกคำเชิญแล้ว แต่ส่งอีเมลไม่สำเร็จ" : "Invite saved, but email delivery failed", variant: "destructive" }); }
      toast({ title: language === "th" ? "ส่งคำเชิญแล้ว" : "Invite sent", description: language === "th" ? "ส่งอีเมลพร้อมลิงก์ดูคำเชิญแล้ว" : "An email with the invite link was sent." });
      await loadFriends();
    } catch { toast({ title: language === "th" ? "ส่งคำเชิญไม่สำเร็จ" : "Could not send invite", variant: "destructive" }); }
    finally { setSending(false); }
  };

  const act = async (operation: () => Promise<unknown>) => {
    try { await operation(); await loadFriends(); }
    catch { toast({ title: language === "th" ? "ทำรายการไม่สำเร็จ" : "Action failed", variant: "destructive" }); }
  };

  return <AuthGuard><SEO title={language === "th" ? "เพื่อน - Submo.ai" : "Friends - Submo.ai"} description="Private friend spending overview" />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/50"><CustomerHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="flex items-center gap-3 text-3xl font-bold"><Users className="h-8 w-8 text-violet-600" />{language === "th" ? "เพื่อน" : "Friends"}</h1><p className="mt-2 text-muted-foreground">{language === "th" ? "เปรียบเทียบภาพรวมค่าใช้จ่ายกับคนที่คุณไว้ใจ" : "Compare spending overviews with people you trust."}</p></div><Button variant="outline" onClick={() => router.push("/dashboard")}>{language === "th" ? "กลับ Dashboard" : "Back to dashboard"}</Button></div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="h-fit border-violet-500/20"><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-violet-600" />{language === "th" ? "เพิ่มเพื่อน" : "Add a friend"}</CardTitle><CardDescription>{language === "th" ? "เพื่อนจะเห็นเฉพาะยอดรวมและหมวดหมู่ที่คุณเลือกแชร์" : "Friends can only see the overview and categories you choose to share."}</CardDescription></CardHeader><CardContent><form onSubmit={invite} className="space-y-3"><Label htmlFor="friend-email">{language === "th" ? "อีเมลเพื่อน" : "Friend’s email"}</Label><Input id="friend-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" required /><Button type="submit" disabled={sending} className="w-full gap-2"><Mail className="h-4 w-4" />{sending ? (language === "th" ? "กำลังส่ง…" : "Sending…") : (language === "th" ? "ส่งคำเชิญ" : "Send invite")}</Button></form><div className="mt-5 rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />{language === "th" ? "ไม่มีการค้นหาสมาชิกสาธารณะ และจะไม่เผยชื่อบริการ วันต่ออายุ หรือข้อมูลการชำระเงิน" : "There is no public member search. Service names, renewal dates, and payment information are never shared."}</div></CardContent></Card>

          <div className="space-y-6">
            {incoming.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">{language === "th" ? "คำเชิญที่รอตอบรับ" : "Pending invites"}</h2><div className="space-y-3">{incoming.map((friend) => <Card key={friend.friendship_id}><CardContent className="flex items-center gap-3 p-4"><FriendAvatar friend={friend} /><div className="min-w-0 flex-1"><p className="font-semibold">{friend.friend_name}</p><p className="text-sm text-muted-foreground">{language === "th" ? "ต้องการเชื่อมต่อกับคุณ" : "wants to connect with you"}</p></div><Button size="sm" onClick={() => act(() => friendService.respond(friend.friendship_id, true))}><Check className="mr-1 h-4 w-4" />{language === "th" ? "ยอมรับ" : "Accept"}</Button><Button size="icon" variant="ghost" onClick={() => act(() => friendService.respond(friend.friendship_id, false))} aria-label="Decline"><X className="h-4 w-4" /></Button></CardContent></Card>)}</div></section>}
            {outgoing.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">{language === "th" ? "คำเชิญที่ส่งแล้ว" : "Sent invites"}</h2><div className="space-y-2">{outgoing.map((friend) => <Card key={friend.friendship_id}><CardContent className="flex items-center gap-3 p-4"><FriendAvatar friend={friend} /><div className="flex-1"><p className="font-medium">{friend.friend_name}</p><p className="text-sm text-muted-foreground">{language === "th" ? "กำลังรอตอบรับ" : "Awaiting response"}</p></div><Button size="sm" variant="ghost" onClick={() => act(() => friendService.remove(friend.friendship_id))}>{language === "th" ? "ยกเลิก" : "Cancel"}</Button></CardContent></Card>)}</div></section>}
            <section><h2 className="mb-3 text-lg font-semibold">{language === "th" ? "เพื่อนของคุณ" : "Your friends"}</h2>{loading ? <p className="text-muted-foreground">{language === "th" ? "กำลังโหลด…" : "Loading…"}</p> : accepted.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="mx-auto mb-3 h-9 w-9 opacity-50" />{language === "th" ? "ยังไม่มีเพื่อน เริ่มจากส่งคำเชิญด้วยอีเมล" : "No friends yet. Start by inviting someone by email."}</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{accepted.map((friend) => <FriendCard key={friend.friendship_id} friend={friend} language={language} preferredCurrency={preferredCurrency} formatCurrency={formatCurrency} onVisibility={(visibility) => act(() => friendService.updateVisibility(friend.friendship_id, visibility))} onRemove={() => act(() => friendService.remove(friend.friendship_id))} onBlock={() => act(() => friendService.remove(friend.friendship_id, true))} />)}</div>}</section>
          </div>
        </div>
      </main>
    </div></AuthGuard>;
}

function FriendAvatar({ friend }: { friend: FriendOverview }) { return <Avatar><AvatarImage src={friend.friend_avatar_url || undefined} alt="" /><AvatarFallback>{friendInitial(friend.friend_name)}</AvatarFallback></Avatar>; }

function FriendCard({ friend, language, preferredCurrency, formatCurrency, onVisibility, onRemove, onBlock }: { friend: FriendOverview; language: "th" | "en"; preferredCurrency: string; formatCurrency: (amount: number, currency: string) => string; onVisibility: (visibility: "none" | "summary") => void; onRemove: () => void; onBlock: () => void; }) {
  const monthly = friendService.convertTotals(friend.monthly_by_currency || {}, preferredCurrency);
  const yearly = friendService.convertTotals(friend.yearly_by_currency || {}, preferredCurrency);
  const categoryNames = Object.keys(friend.categories || {}).slice(0, 3);
  return <Card className="overflow-hidden"><CardContent className="p-5"><div className="flex items-start gap-3"><FriendAvatar friend={friend} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{friend.friend_name}</p><p className="text-xs text-muted-foreground">{language === "th" ? "แสดงยอดตามสกุลเงินของคุณ" : "Shown in your preferred currency"}</p></div><Select value={friend.my_visibility} onValueChange={(value) => onVisibility(value as "none" | "summary")}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="summary">{language === "th" ? "แชร์ภาพรวม" : "Share overview"}</SelectItem><SelectItem value="none">{language === "th" ? "ไม่แชร์" : "Don’t share"}</SelectItem></SelectContent></Select></div>{friend.can_view_overview ? <><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{language === "th" ? "ต่อเดือน" : "Monthly"}</p><p className="mt-1 font-bold">{formatCurrency(monthly, preferredCurrency)}</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{language === "th" ? "ต่อปี" : "Yearly"}</p><p className="mt-1 font-bold">{formatCurrency(yearly, preferredCurrency)}</p></div></div><p className="mt-4 text-sm text-muted-foreground"><BarChart3 className="mr-1 inline h-4 w-4" />{friend.subscription_count} {language === "th" ? "รายการที่ใช้งาน" : "active subscriptions"}{categoryNames.length > 0 && ` · ${categoryNames.join(", ")}`}</p><p className="mt-2 text-xs text-muted-foreground">{language === "th" ? "ยอดเป็นค่าประมาณตามอัตราแลกเปลี่ยน" : "Amounts are approximate exchange-rate conversions."}</p></> : <div className="mt-5 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><EyeOff className="mr-2 inline h-4 w-4" />{language === "th" ? "เพื่อนคนนี้เลือกไม่แชร์ภาพรวม" : "This friend chose not to share their overview."}</div>}<div className="mt-5 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={onRemove}><UserMinus className="mr-1 h-4 w-4" />{language === "th" ? "ลบ" : "Remove"}</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={onBlock}>{language === "th" ? "บล็อก" : "Block"}</Button></div></CardContent></Card>;
}
