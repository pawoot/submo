import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import type { UnmappedRecord } from "@/services/adminMigrationService";
import { fixSubscriptionCategory, fixSubscriptionPaymentMethod } from "@/services/adminMigrationService";
import { supabase } from "@/integrations/supabase/client";

interface UnmappedRecordFixerProps {
  record: UnmappedRecord | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name_en: string;
  name_th: string;
}

interface PaymentMethod {
  id: string;
  name_en: string;
  name_th: string;
}

export function UnmappedRecordFixer({ record, open, onClose, onSuccess }: UnmappedRecordFixerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && record) {
      loadOptions();
      setSelectedValue("");
      setError(null);
      setSuccess(false);
    }
  }, [open, record]);

  const loadOptions = async () => {
    if (!record) return;

    if (record.issue_type === "unmapped_category") {
      const { data } = await supabase.from("categories").select("id, name_en, name_th").order("name_en");
      setCategories(data || []);
    } else if (record.issue_type === "unmapped_payment_method") {
      const { data } = await supabase
        .from("payment_methods")
        .select("id, name_en, name_th")
        .order("name_en");
      setPaymentMethods(data || []);
    }
  };

  const handleFix = async () => {
    if (!record || !selectedValue) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (record.issue_type === "unmapped_category") {
        result = await fixSubscriptionCategory(record.record_id, selectedValue);
      } else if (record.issue_type === "unmapped_payment_method") {
        result = await fixSubscriptionPaymentMethod(record.record_id, selectedValue);
      } else {
        throw new Error("Unsupported issue type");
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to fix record");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  const getTitle = () => {
    switch (record.issue_type) {
      case "unmapped_category":
        return "Fix Unmapped Category";
      case "unmapped_payment_method":
        return "Fix Unmapped Payment Method";
      default:
        return "Fix Record";
    }
  };

  const getDescription = () => {
    return `Subscription: ${record.subscription_name || "Unknown"} | Legacy Value: ${record.legacy_value || "None"}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {success ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Record fixed successfully! Refreshing...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>
                  {record.issue_type === "unmapped_category"
                    ? "Select Category"
                    : "Select Payment Method"}
                </Label>
                {record.issue_type === "unmapped_category" ? (
                  <Select value={selectedValue} onValueChange={setSelectedValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_en} ({cat.name_th})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : record.issue_type === "unmapped_payment_method" ? (
                  <Select value={selectedValue} onValueChange={setSelectedValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a payment method..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          {pm.name_en} ({pm.name_th})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This issue type is not yet supported for automatic fixing.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  This will update the subscription record and log the change in the audit trail.
                  The previous value will be preserved in the subscription event log.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading || success}>
            Cancel
          </Button>
          <Button onClick={handleFix} disabled={loading || success || !selectedValue}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {success ? "Fixed!" : "Apply Fix"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}