import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { currencyService } from "@/services/currencyService";
import { profileService } from "@/services/profileService";

interface CurrencyContextType {
  preferredCurrency: string;
  setPreferredCurrency: (currency: string) => Promise<void>;
  convertAmount: (amount: number, fromCurrency: string) => Promise<number>;
  formatAmount: (amount: number, fromCurrency: string) => Promise<string>;
  formatCurrency: (amount: number, currency: string) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [preferredCurrency, setPreferredCurrencyState] = useState<string>("USD");
  const [isLoading, setIsLoading] = useState(true);

  // Load user's preferred currency on mount
  useEffect(() => {
    loadPreferredCurrency();
  }, []);

  const loadPreferredCurrency = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const profile = await profileService.getCurrentProfile();
        if (profile?.preferred_currency) {
          setPreferredCurrencyState(profile.preferred_currency);
        }
      }
    } catch (error) {
      console.error("Error loading preferred currency:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setPreferredCurrency = async (currency: string) => {
    try {
      await profileService.updatePreferredCurrency(currency);
      setPreferredCurrencyState(currency);
      
      // Clear exchange rate cache to get fresh rates
      currencyService.clearCache();
    } catch (error) {
      console.error("Error updating preferred currency:", error);
      throw error;
    }
  };

  const convertAmount = async (amount: number, fromCurrency: string): Promise<number> => {
    console.log(`🔄 convertAmount called: ${amount} ${fromCurrency} → ${preferredCurrency}`);
    
    if (fromCurrency === preferredCurrency) {
      console.log(`✅ Same currency, no conversion needed`);
      return amount;
    }
    
    try {
      const converted = await currencyService.convertCurrency(amount, fromCurrency, preferredCurrency);
      console.log(`✅ Conversion result: ${amount} ${fromCurrency} = ${converted} ${preferredCurrency}`);
      return converted;
    } catch (error) {
      console.error("❌ Currency conversion failed:", error);
      return amount; // Fallback to original amount
    }
  };

  const formatAmount = async (amount: number, fromCurrency: string): Promise<string> => {
    const convertedAmount = await convertAmount(amount, fromCurrency);
    return currencyService.formatAmount(convertedAmount, preferredCurrency);
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return currencyService.formatAmount(amount, currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        preferredCurrency,
        setPreferredCurrency,
        convertAmount,
        formatAmount,
        formatCurrency,
        isLoading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}