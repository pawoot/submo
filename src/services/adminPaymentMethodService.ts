import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

/**
 * Get all payment methods (admin view)
 */
export async function getAllPaymentMethods() {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get payment method stats
 */
export async function getPaymentMethodStats() {
  // Get all payment methods
  const { data: methods, error: methodsError } = await supabase
    .from("payment_methods")
    .select("*")
    .order("display_order", { ascending: true });

  if (methodsError) throw methodsError;

  // Get subscription counts
  const stats = await Promise.all(
    methods.map(async (method) => {
      const { count } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("payment_method_id", method.id);

      return {
        ...method,
        subscriptionCount: count || 0
      };
    })
  );

  return stats;
}

/**
 * Create new payment method
 */
export async function createPaymentMethod(data: Partial<PaymentMethod>) {
  const { data: newMethod, error } = await supabase
    .from("payment_methods")
    .insert(data as any)
    .select()
    .single();

  if (error) throw error;
  return newMethod;
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
  const { data: updatedMethod, error } = await supabase
    .from("payment_methods")
    .update(data as any)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updatedMethod;
}

/**
 * Delete payment method (only if not used)
 */
export async function deletePaymentMethod(id: string) {
  // Check if used
  const { count } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("payment_method_id", id);

  if (count && count > 0) {
    throw new Error(`Cannot delete payment method: used by ${count} subscriptions`);
  }

  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id);

  if (error) throw error;
}