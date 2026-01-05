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
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fixSubscriptionPaymentMethod } from "@/services/adminMigrationService";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name_en: string;
  name_th: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface FixPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
  currentPaymentMethodId: string | null;
  onSuccess: () => void;
}

export function FixPaymentMethodDialog({
  open,
  onOpenChange,
  subscriptionId,
  subscriptionName,
  currentPaymentMethodId,
  onSuccess,
}: FixPaymentMethodDialogProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name_en: "",
    name_th: "",
    slug: "",
    icon: "",
    color: "#10B981",
  });
  const { toast } = useToast();

  // Fetch payment methods
  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  async function fetchPaymentMethods() {
    setLoadingPaymentMethods(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("id, name_en, name_th, slug, icon, color")
      .order("name_en");

    if (error) {
      console.error("Error fetching payment methods:", error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } else {
      setPaymentMethods(data || []);
    }
    setLoadingPaymentMethods(false);
  }

  async function handleCreateNewPaymentMethod() {
    if (!newPaymentMethod.name_en || !newPaymentMethod.slug) {
      toast({
        title: "Validation Error",
        description: "Name (EN) and Slug are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .insert({
        name_en: newPaymentMethod.name_en,
        name_th: newPaymentMethod.name_th || newPaymentMethod.name_en,
        slug: newPaymentMethod.slug,
        icon: newPaymentMethod.icon || null,
        color: newPaymentMethod.color,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      toast({
        title: "Error",
        description: "Failed to create payment method",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Add to list and select it
    setPaymentMethods([...paymentMethods, data]);
    setSelectedPaymentMethodId(data.id);
    setShowCreateNew(false);
    setNewPaymentMethod({ name_en: "", name_th: "", slug: "", icon: "", color: "#10B981" });
    setLoading(false);

    toast({
      title: "Payment Method Created",
      description: `"${data.name_en}" has been created successfully`,
    });
  }

  async function handleApplyFix() {
    if (!selectedPaymentMethodId) {
      toast({
        title: "Validation Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await fixSubscriptionPaymentMethod(subscriptionId, selectedPaymentMethodId);

    if (result.success) {
      toast({
        title: "Payment Method Fixed",
        description: `Successfully updated payment method for "${subscriptionName}"`,
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fix payment method",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id === selectedPaymentMethodId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fix Payment Method</DialogTitle>
          <DialogDescription>
            Update payment method for <strong>{subscriptionName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!showCreateNew ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Select Payment Method</Label>
              {loadingPaymentMethods ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select
                  value={selectedPaymentMethodId}
                  onValueChange={setSelectedPaymentMethodId}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Choose a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.icon && <span className="mr-2">{pm.icon}</span>}
                        {pm.name_en}
                        {pm.name_th && pm.name_th !== pm.name_en && (
                          <span className="text-muted-foreground ml-1">({pm.name_th})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedPaymentMethod && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Preview</p>
                    <p className="text-sm text-muted-foreground">
                      This will update <strong>1 subscription</strong> to payment method:{" "}
                      <strong>{selectedPaymentMethod.name_en}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateNew(true)}
            >
              Create New Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">Name (English) *</Label>
              <Input
                id="name_en"
                placeholder="e.g., Credit Card"
                value={newPaymentMethod.name_en}
                onChange={(e) =>
                  setNewPaymentMethod({ ...newPaymentMethod, name_en: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_th">Name (Thai)</Label>
              <Input
                id="name_th"
                placeholder="e.g., บัตรเครดิต"
                value={newPaymentMethod.name_th}
                onChange={(e) =>
                  setNewPaymentMethod({ ...newPaymentMethod, name_th: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., credit-card"
                value={newPaymentMethod.slug}
                onChange={(e) =>
                  setNewPaymentMethod({ ...newPaymentMethod, slug: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                placeholder="e.g., 💳"
                value={newPaymentMethod.icon}
                onChange={(e) =>
                  setNewPaymentMethod({ ...newPaymentMethod, icon: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={newPaymentMethod.color}
                onChange={(e) =>
                  setNewPaymentMethod({ ...newPaymentMethod, color: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateNew(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateNewPaymentMethod}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Select
              </Button>
            </div>
          </div>
        )}

        {!showCreateNew && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyFix}
              disabled={loading || !selectedPaymentMethodId}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Fix
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}