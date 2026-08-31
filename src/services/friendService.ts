import { supabase } from "@/integrations/supabase/client";
import { currencyService } from "@/services/currencyService";

export type FriendOverview = {
  friendship_id: string;
  friend_id: string;
  friend_name: string;
  friend_avatar_url: string | null;
  relationship_status: "pending" | "accepted" | "declined" | "blocked";
  is_incoming: boolean;
  my_visibility: "none" | "summary";
  can_view_overview: boolean;
  subscription_count: number;
  monthly_by_currency: Record<string, number>;
  yearly_by_currency: Record<string, number>;
  categories: Record<string, number>;
};

const rpc = () => supabase as any;

export const friendService = {
  async getOverviews(): Promise<FriendOverview[]> {
    const { data, error } = await rpc().rpc("get_friend_overviews");
    if (error) throw error;
    return (data || []) as FriendOverview[];
  },
  async inviteByEmail(email: string) {
    const { error } = await rpc().rpc("request_friend_by_email", { p_email: email });
    if (error) throw error;
  },
  async respond(id: string, accept: boolean) {
    const { error } = await rpc().rpc("respond_to_friend_request", { p_friendship_id: id, p_accept: accept });
    if (error) throw error;
  },
  async updateVisibility(id: string, visibility: "none" | "summary") {
    const { error } = await rpc().rpc("update_friend_visibility", { p_friendship_id: id, p_visibility: visibility });
    if (error) throw error;
  },
  async remove(id: string, block = false) {
    const { error } = await rpc().rpc("remove_or_block_friend", { p_friendship_id: id, p_block: block });
    if (error) throw error;
  },
  convertTotals(totals: Record<string, number>, targetCurrency: string) {
    const rates = currencyService.getFallbackRates("USD");
    const targetRate = rates[targetCurrency] || 1;
    return Object.entries(totals).reduce((sum, [currency, amount]) => sum + Number(amount || 0) * (targetRate / (rates[currency] || 1)), 0);
  },
};
