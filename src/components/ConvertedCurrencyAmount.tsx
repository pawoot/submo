import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ConvertedCurrencyAmountProps {
  amount: number;
  currency: string;
  className?: string;
  originalClassName?: string;
}

/**
 * Shows an amount in the user's Profile currency and, when it differs, keeps
 * the originally entered amount visible as a smaller reference value.
 */
export function ConvertedCurrencyAmount({
  amount,
  currency,
  className,
  originalClassName = "text-xs text-muted-foreground",
}: ConvertedCurrencyAmountProps) {
  const { preferredCurrency, convertAmount, formatCurrency } = useCurrency();
  const sourceCurrency = currency || preferredCurrency;
  const [convertedAmount, setConvertedAmount] = useState<number | null>(
    sourceCurrency === preferredCurrency ? amount : null,
  );

  useEffect(() => {
    let isCurrent = true;

    if (sourceCurrency === preferredCurrency) {
      setConvertedAmount(amount);
      return;
    }

    setConvertedAmount(null);
    convertAmount(amount, sourceCurrency).then((result) => {
      if (isCurrent) setConvertedAmount(result);
    });

    return () => {
      isCurrent = false;
    };
  }, [amount, convertAmount, preferredCurrency, sourceCurrency]);

  return (
    <div className="text-right">
      <p className={className}>{convertedAmount === null ? "…" : formatCurrency(convertedAmount, preferredCurrency)}</p>
      {sourceCurrency !== preferredCurrency && (
        <p className={originalClassName}>({formatCurrency(amount, sourceCurrency)})</p>
      )}
    </div>
  );
}
