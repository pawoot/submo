import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRoundPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { friendService, type FriendOverview } from "@/services/friendService";
import { useLanguage } from "@/contexts/LanguageContext";

export function FriendsDashboardWidget() {
  const { language } = useLanguage();
  const [friends, setFriends] = useState<FriendOverview[]>([]);

  useEffect(() => {
    friendService.getOverviews().then(setFriends).catch(() => setFriends([]));
  }, []);

  const accepted = friends.filter((friend) => friend.relationship_status === "accepted").length;
  const incoming = friends.filter((friend) => friend.relationship_status === "pending" && friend.is_incoming).length;

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-background to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-violet-500" />{language === "th" ? "เพื่อน" : "Friends"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-2xl font-bold">{accepted}</p><p className="text-sm text-muted-foreground">{language === "th" ? "เพื่อนที่เชื่อมต่อแล้ว" : "Connected friends"}</p></div>
          {incoming > 0 && <p className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-200">{incoming} {language === "th" ? "คำเชิญรอตอบรับ" : "pending invite"}</p>}
        </div>
        <Link href="/friends" className="mt-4 block"><Button variant="outline" className="w-full gap-2"><UserRoundPlus className="h-4 w-4" />{language === "th" ? "จัดการเพื่อน" : "Manage friends"}</Button></Link>
      </CardContent>
    </Card>
  );
}
