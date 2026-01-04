import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subscriptionTemplateService, type SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function AdminSubscriptionTemplates() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SubscriptionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    amount: "0",
    currency: "THB",
    billing_cycle: "monthly" as "monthly" | "yearly" | "quarterly" | "half-yearly",
    website: "",
    description: "",
    is_active: true,
    usage_count: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadTemplates();
      loadCategories();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const checkAdminAccess = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      if (profile?.role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/");
      }
    } catch (error) {
      router.push("/");
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await subscriptionTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from("categories")
        .select("id, name_en, name_th, slug")
        .eq("is_active", true)
        .order("display_order");
        
      if (data) {
        setCategories(data.map(c => ({
          id: c.id,
          name: c.name_en, // Use name_en as default
          slug: c.slug
        })));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((t) => t.categories?.slug === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      category_id: "",
      amount: "0",
      currency: "USD",
      billing_cycle: "monthly",
      website: "",
      description: "",
      is_active: true,
      usage_count: 0,
    });
    setShowAddDialog(true);
  };

  const handleEdit = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category_id: template.category_id || "",
      amount: template.amount?.toString() || "0",
      currency: template.currency || "THB",
      billing_cycle: (template.billing_cycle as any) || "monthly",
      website: template.website_url || "",
      description: template.description || "",
      is_active: template.is_active ?? true,
      usage_count: template.usage_count || 0,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const confirmAdd = async () => {
    try {
      await subscriptionTemplateService.createTemplate({
        name: formData.name,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        website_url: formData.website,
        description: formData.description,
        is_active: formData.is_active,
        usage_count: 0, // Always 0 for new templates
      });

      toast({
        title: "Success",
        description: "Template added successfully",
      });

      setShowAddDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "Error",
        description: "Failed to add template",
        variant: "destructive",
      });
    }
  };

  const confirmEdit = async () => {
    if (!selectedTemplate) return;

    try {
      await subscriptionTemplateService.updateTemplate(selectedTemplate.id, {
        name: formData.name,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        website_url: formData.website,
        description: formData.description,
        is_active: formData.is_active,
        usage_count: formData.usage_count, // Allow editing usage_count
      });

      toast({
        title: "Success",
        description: "Template updated successfully",
      });

      setShowEditDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await subscriptionTemplateService.deleteTemplate(selectedTemplate.id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      setShowDeleteDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category_id: template.category_id,
      amount: template.amount,
      currency: template.currency,
      billing_cycle: template.billing_cycle,
      website: template.website_url || "",
      description: template.description || "",
      is_active: template.is_active,
      usage_count: template.usage_count || 0,
    });
    setShowEditDialog(true);
  };

  if (!isAdmin) {
    return null;
  }

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

  return (
    <AuthGuard>
      <SEO title="Admin - Subscription Templates" />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
              </Link>
              <h1 className="text-xl font-bold">Subscription Templates</h1>
            </div>
            <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Template</Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardContent className="pt-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search templates..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{t("admin.templates.table.icon")}</TableHead>
                    <TableHead>{t("admin.templates.table.name")}</TableHead>
                    <TableHead>{t("admin.templates.table.website")}</TableHead>
                    <TableHead>{t("admin.templates.table.category")}</TableHead>
                    <TableHead className="text-right">{t("admin.templates.table.amount")}</TableHead>
                    <TableHead className="text-center">{t("admin.templates.table.users")}</TableHead>
                    <TableHead className="text-center">{t("admin.templates.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.templates.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {template.website_url ? (
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${new URL(template.website_url).hostname}&sz=128`}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = template.name.charAt(0).toUpperCase();
                                  parent.className += " text-slate-600 dark:text-slate-400 font-semibold";
                                }
                              }}
                            />
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">
                              {template.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        {template.website_url ? (
                          <a
                            href={template.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                          >
                            {new URL(template.website_url).hostname}
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.categories?.name_en || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {template.amount} {template.currency}
                        <div className="text-xs text-muted-foreground">
                          {t(`common.billingCycle.${template.billing_cycle}`)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {template.usage_count >= 10 && <span className="text-lg">🔥</span>}
                          {template.usage_count >= 5 && template.usage_count < 10 && <span className="text-lg">⭐</span>}
                          {template.usage_count < 5 && template.usage_count > 0 && <span className="text-lg">📊</span>}
                          {template.usage_count === 0 && <span className="text-lg">❄️</span>}
                          <span className="font-medium">{template.usage_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
           {filteredTemplates.length > itemsPerPage && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                     <span className="px-4">Page {currentPage} of {totalPages}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
           <DialogHeader><DialogTitle>Add Template</DialogTitle></DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="space-y-4">
               <div>
                 <Label htmlFor="name">{t("admin.templateName")} *</Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   placeholder={t("admin.enterTemplateName")}
                 />
               </div>

               <div>
                 <Label htmlFor="website">{t("admin.websiteUrl")}</Label>
                 <Input
                   id="website"
                   type="url"
                   value={formData.website}
                   onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                   placeholder="https://example.com"
                 />
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                   {t("admin.faviconAutomatic")}
                 </p>
               </div>

               <div>
                 <Label htmlFor="category">{t("admin.category")} *</Label>
                 <Select
                   value={formData.category_id}
                   onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder={t("admin.selectCategory")} />
                   </SelectTrigger>
                   <SelectContent>
                     {categories.map((cat) => (
                       <SelectItem key={cat.id} value={cat.id}>
                         {cat.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="amount">{t("admin.templates.form.amount")}</Label>
                   <Input
                     id="amount"
                     type="number"
                     step="0.01"
                     value={formData.amount}
                     onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                     placeholder="0.00"
                   />
                 </div>

                 <div>
                   <Label htmlFor="currency">{t("admin.currency")}</Label>
                   <Select
                     value={formData.currency}
                     onValueChange={(value) => setFormData({ ...formData, currency: value })}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="THB">THB (฿)</SelectItem>
                       <SelectItem value="USD">USD ($)</SelectItem>
                       <SelectItem value="EUR">EUR (€)</SelectItem>
                       <SelectItem value="GBP">GBP (£)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div>
                 <Label htmlFor="billingCycle">{t("admin.billingCycle")}</Label>
                 <Select
                   value={formData.billing_cycle}
                   onValueChange={(value: any) => setFormData({ ...formData, billing_cycle: value })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="monthly">{t("subscriptions.monthly")}</SelectItem>
                     <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                     <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                     <SelectItem value="yearly">{t("subscriptions.yearly")}</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label htmlFor="description">{t("admin.description")}</Label>
                 <Textarea
                   id="description"
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   placeholder={t("admin.enterDescription")}
                   rows={3}
                 />
               </div>
             </div>
             
             <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={c => setFormData({...formData, is_active: c})} 
                />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
             <Button onClick={confirmAdd} disabled={loading}>Save</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
           <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="space-y-4">
               <div>
                 <Label htmlFor="name">{t("admin.templateName")} *</Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   placeholder={t("admin.enterTemplateName")}
                 />
               </div>

               <div>
                 <Label htmlFor="website">{t("admin.websiteUrl")}</Label>
                 <Input
                   id="website"
                   type="url"
                   value={formData.website}
                   onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                   placeholder="https://example.com"
                 />
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                   {t("admin.faviconAutomatic")}
                 </p>
               </div>

               <div>
                 <Label htmlFor="category">{t("admin.category")} *</Label>
                 <Select
                   value={formData.category_id}
                   onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder={t("admin.selectCategory")} />
                   </SelectTrigger>
                   <SelectContent>
                     {categories.map((cat) => (
                       <SelectItem key={cat.id} value={cat.id}>
                         {cat.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="amount">{t("admin.templates.form.amount")}</Label>
                   <Input
                     id="amount"
                     type="number"
                     step="0.01"
                     value={formData.amount}
                     onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                     placeholder="0.00"
                   />
                 </div>

                 <div>
                   <Label htmlFor="currency">{t("admin.currency")}</Label>
                   <Select
                     value={formData.currency}
                     onValueChange={(value) => setFormData({ ...formData, currency: value })}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="THB">THB (฿)</SelectItem>
                       <SelectItem value="USD">USD ($)</SelectItem>
                       <SelectItem value="EUR">EUR (€)</SelectItem>
                       <SelectItem value="GBP">GBP (£)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div>
                 <Label htmlFor="billingCycle">{t("admin.billingCycle")}</Label>
                 <Select
                   value={formData.billing_cycle}
                   onValueChange={(value: any) => setFormData({ ...formData, billing_cycle: value })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="monthly">{t("subscriptions.monthly")}</SelectItem>
                     <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                     <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                     <SelectItem value="yearly">{t("subscriptions.yearly")}</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label htmlFor="description">{t("admin.description")}</Label>
                 <Textarea
                   id="description"
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   placeholder={t("admin.enterDescription")}
                   rows={3}
                 />
               </div>

               {/* Usage Count - Only show in Edit mode */}
               {showEditDialog && (
                 <div>
                   <Label htmlFor="usage_count">
                     {t("admin.templates.form.usageCount")}
                     <span className="text-xs text-muted-foreground ml-2">
                       ({t("admin.templates.form.usageCountHelp")})
                     </span>
                   </Label>
                   <Input
                     id="usage_count"
                     type="number"
                     min="0"
                     value={formData.usage_count}
                     onChange={(e) => setFormData({ ...formData, usage_count: parseInt(e.target.value) || 0 })}
                   />
                 </div>
               )}
             </div>
             
             <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={c => setFormData({...formData, is_active: c})} 
                />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
             <Button onClick={confirmEdit} disabled={loading}>Update</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
           <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
           <p>Are you sure you want to delete {selectedTemplate?.name}?</p>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
             <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}