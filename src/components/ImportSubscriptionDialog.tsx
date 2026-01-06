import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Upload, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  parseCSV, 
  mapToSubscriptions, 
  parseImageFile,
  mapImportItemsToSubscriptions,
  prepareForDatabase, 
  type MappedSubscription 
} from "@/services/importService";
import { subscriptionService } from "@/services/subscriptionService";
import { authService } from "@/services/authService";
import { ImportReviewTable } from "@/components/ImportReviewTable";

interface ImportSubscriptionDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ImportSubscriptionDialog({ onSuccess, trigger }: ImportSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [mappedData, setMappedData] = useState<MappedSubscription[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Legacy handler for the dedicated CSV input
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(e, 'csv');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus(type === 'csv' ? t("import.status.reading_csv") : t("import.status.init_scanner"));

    try {
      let mappedResults: MappedSubscription[] = [];
      
      if (type === 'csv') {
        const { transactions, error } = await parseCSV(file);
        if (error) throw new Error(error);
        if (transactions.length === 0) throw new Error("No transactions found");
        
        mappedResults = mapToSubscriptions(transactions);
      } else {
        // Image parsing
        setProcessingStatus(t("import.status.scanning"));
        // Small delay to let UI update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const items = await parseImageFile(file);
        
        setProcessingStatus(t("import.status.analyzing"));
        mappedResults = mapImportItemsToSubscriptions(items);
      }

      if (mappedResults.length === 0) {
        toast({
          title: t("import.no_subs.title"),
          description: type === 'csv' 
            ? t("import.no_subs.csv")
            : t("import.no_subs.image"),
          variant: "destructive",
        });
        return;
      }

      setMappedData(mappedResults);
      setStep("review");
      
      toast({
        title: t("import.processed.title"),
        description: t("import.processed.desc").replace("{count}", mappedResults.length.toString()),
      });
      
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: t("import.fail.title"),
        description: error.message || t("import.fail.desc"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
      // Reset input
      e.target.value = "";
    }
  };

  const handleImportConfirm = async (selectedSubs: MappedSubscription[]) => {
    setIsProcessing(true);
    setProcessingStatus(t("import.status.saving"));
    
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      const dbData = prepareForDatabase(selectedSubs, user.id);
      await subscriptionService.bulkCreateSubscriptions(dbData);

      // Create a nice summary string
      const names = dbData.map(d => d.name).slice(0, 3).join(", ");
      const remaining = dbData.length - 3;
      const summary = remaining > 0 ? `${names} and ${remaining} more` : names;

      toast({
        title: t("import.success.title"),
        description: t("import.success.desc").replace("{summary}", summary),
        variant: "default",
      });

      setOpen(false);
      resetState();
      onSuccess?.();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: t("import.fail.title"),
        description: t("import.fail.desc"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const resetState = () => {
    setStep("upload");
    setMappedData([]);
    setProcessingStatus("");
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Small delay to prevent UI flicker while closing
      setTimeout(resetState, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileUp className="w-4 h-4" />
            {t("import.button")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>
            {step === "upload" 
              ? t("import.desc.upload")
              : t("import.desc.review")}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" className="gap-2">
                <FileText className="w-4 h-4" /> {t("import.tab.csv")}
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="w-4 h-4" /> {t("import.tab.image")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="csv" className="mt-4">
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t("import.csv.click")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("import.csv.support")}
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <p className="text-sm text-primary animate-pulse">{processingStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium mb-1">{t("import.how_csv.title")}</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>{t("import.how_csv.1")}</li>
                    <li>{t("import.how_csv.2")}</li>
                    <li>{t("import.how_csv.3")}</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("import.image.click")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("import.image.desc")}
                </p>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  disabled={isProcessing}
                />
                <Button variant="outline" disabled={isProcessing}>
                  {isProcessing ? t("import.btn.processing") : t("import.btn.select_image")}
                </Button>
                {isProcessing && (
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p className="text-sm text-primary animate-pulse">{processingStatus}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  {t("import.image.support")}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <ImportReviewTable
            subscriptions={mappedData}
            onConfirm={handleImportConfirm}
            onCancel={() => setStep("upload")}
            isLoading={isProcessing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}