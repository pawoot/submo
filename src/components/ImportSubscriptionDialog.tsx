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
import { 
  parseCSV, 
  mapToSubscriptions, 
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
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [mappedData, setMappedData] = useState<MappedSubscription[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so same file can be selected again if needed
    e.target.value = "";
    
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        const { transactions, error } = await parseCSV(file);
        
        if (error) {
          throw new Error(error);
        }

        if (transactions.length === 0) {
          throw new Error("No transactions found in CSV file");
        }

        const mapped = mapToSubscriptions(transactions);
        
        if (mapped.length === 0) {
          toast({
            title: "No subscriptions found",
            description: "We couldn't identify any potential subscriptions in this file.",
            variant: "destructive",
          });
          return;
        }

        setMappedData(mapped);
        setStep("review");
      } else {
        // Image/PDF handling (Placeholder for Phase 3)
        toast({
          title: "Format not supported yet",
          description: "Currently only CSV files are supported. Image import coming soon!",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Something went wrong processing your file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportConfirm = async (selectedSubs: MappedSubscription[]) => {
    setIsProcessing(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      const dbData = prepareForDatabase(selectedSubs, user.id);
      await subscriptionService.bulkCreateSubscriptions(dbData);

      toast({
        title: "Import Successful",
        description: `Successfully imported ${dbData.length} subscriptions.`,
        variant: "default",
      });

      setOpen(false);
      resetState();
      onSuccess?.();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save imported subscriptions.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setStep("upload");
    setMappedData([]);
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
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Subscriptions</DialogTitle>
          <DialogDescription>
            {step === "upload" 
              ? "Upload your bank statement to automatically detect subscriptions." 
              : "Review and select the subscriptions you want to import."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" className="gap-2">
                <FileText className="w-4 h-4" /> CSV Statement
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="w-4 h-4" /> Image / Slip (Beta)
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
                    <h3 className="font-semibold text-lg">Click to upload CSV</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports standard bank statement formats (Date, Description, Amount)
                    </p>
                  </div>
                  {isProcessing && <p className="text-sm text-primary animate-pulse">Processing file...</p>}
                </div>
              </div>

              <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium mb-1">How CSV import works:</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>We detect columns for Date, Description, and Amount automatically</li>
                    <li>Known services (Netflix, Spotify, etc.) are matched by name</li>
                    <li>One-time transfers and unrelated transactions are filtered out</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center opacity-60">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Image Import Coming Soon</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We're working on AI-powered slip and screenshot scanning.
                    </p>
                  </div>
                </div>
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