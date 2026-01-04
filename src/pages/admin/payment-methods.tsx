import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, getPaymentMethodStats } from "@/services/adminPaymentMethodService";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"] & {
  subscriptionCount?: number;
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name_en: "",
    name_th: "",
    slug: "",
    icon: "",
    color: "#3b82f6",
    is_active: true
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPaymentMethodStats();
      setMethods(data);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name_en: method.name_en,
      name_th: method.name_th,
      slug: method.slug,
      icon: method.icon,
      color: method.color,
      is_active: method.is_active || true
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, count: number) => {
    if (count > 0) {
      toast({
        title: "Cannot Delete",
        description: `This payment method is used by ${count} subscriptions`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this payment method?")) return;

    try {
      await deletePaymentMethod(id);
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
      loadData();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, formData);
        toast({
          title: "Success",
          description: "Payment method updated successfully",
        });
      } else {
        await createPaymentMethod(formData);
        toast({
          title: "Success",
          description: "Payment method created successfully",
        });
      }
      setDialogOpen(false);
      setEditingMethod(null);
      setFormData({
        name_en: "",
        name_th: "",
        slug: "",
        icon: "",
        color: "#3b82f6",
        is_active: true
      });
      loadData();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-8 h-8" />
              Payment Methods
            </h1>
            <p className="text-gray-500 mt-1">Manage payment options for subscriptions</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingMethod(null);
                setFormData({
                  name_en: "",
                  name_th: "",
                  slug: "",
                  icon: "",
                  color: "#3b82f6",
                  is_active: true
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name (EN)</Label>
                    <Input 
                      value={formData.name_en} 
                      onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                      required
                      placeholder="Credit Card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (TH)</Label>
                    <Input 
                      value={formData.name_th} 
                      onChange={(e) => setFormData({...formData, name_th: e.target.value})}
                      required
                      placeholder="บัตรเครดิต"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Slug (Unique ID)</Label>
                  <Input 
                    value={formData.slug} 
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    required
                    placeholder="credit-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon (Emoji)</Label>
                    <Input 
                      value={formData.icon} 
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      required
                      placeholder="💳"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color (Hex)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={formData.color} 
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-12 p-1"
                      />
                      <Input 
                        value={formData.color} 
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        required
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payment Methods ({methods.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icon</TableHead>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (TH)</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Subscriptions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="text-2xl">{method.icon}</TableCell>
                      <TableCell className="font-medium">{method.name_en}</TableCell>
                      <TableCell>{method.name_th}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{method.slug}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: method.color }}
                          />
                          <span className="text-xs text-gray-500">{method.color}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {method.subscriptionCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(method)}
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(method.id, method.subscriptionCount || 0)}
                            className={method.subscriptionCount && method.subscriptionCount > 0 ? "opacity-50 cursor-not-allowed" : ""}
                            disabled={!!(method.subscriptionCount && method.subscriptionCount > 0)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}