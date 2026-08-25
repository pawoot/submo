import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export interface SubscriptionCost {
  subscription: Subscription;
  monthlyCost: number;
  yearlyCost: number;
}

function getMonthlyCost(amount: number, billingCycle: string): number {
  switch (billingCycle) {
    case "yearly":
      return amount / 12;
    case "half-yearly":
      return amount / 6;
    case "quarterly":
      return amount / 3;
    default:
      return amount;
  }
}

/** Converts every subscription into the currency selected in Profile. */
export function useSubscriptionCosts(subscriptions: Subscription[]) {
  const { preferredCurrency, convertAmount } = useCurrency();
  const [costs, setCosts] = useState<SubscriptionCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const calculateCosts = async () => {
      setIsLoading(true);
      const convertedCosts = await Promise.all(
        subscriptions
          .filter((subscription) => subscription.is_active)
          .map(async (subscription) => {
            const convertedAmount = await convertAmount(subscription.amount, subscription.currency || preferredCurrency);
            const monthlyCost = getMonthlyCost(convertedAmount, subscription.billing_cycle);
            return {
              subscription,
              monthlyCost,
              yearlyCost: monthlyCost * 12,
            };
          }),
      );

      if (isCurrent) {
        setCosts(convertedCosts);
        setIsLoading(false);
      }
    };

    calculateCosts();
    return () => {
      isCurrent = false;
    };
  }, [convertAmount, preferredCurrency, subscriptions]);

  return { costs, isLoading };
}
