import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { MigrationHealthCard } from "@/components/admin/MigrationHealthCard";
import { FeatureFlagControl } from "@/components/admin/FeatureFlagControl";
import { MigrationReportTable } from "@/components/admin/MigrationReportTable";
import { UnmappedRecordFixer } from "@/components/admin/UnmappedRecordFixer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMigrationHealth,
  getFeatureFlags,
  getUnmappedRecords,
  toggleFeatureFlag,
  rerunCategoryBackfill,
  rerunPaymentMethodBackfill,
  downloadReportAsCSV,
  downloadReportAsJSON,
  type MigrationHealth,
  type FeatureFlag,
  type UnmappedRecord,
} from "@/services/adminMigrationService";

export default function MigrationDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const [health, setHealth] = useState<MigrationHealth | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [records, setRecords] = useState<UnmappedRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<UnmappedRecord | null>(null);

  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadHealth(), loadFlags(), loadRecords()]);
  };

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await getMigrationHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      console.error("Error loading migration health:", err);
      setError("Failed to load migration health");
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadFlags = async () => {
    setLoadingFlags(true);
    try {
      const data = await getFeatureFlags();
      setFlags(data);
    } catch (err) {
      console.error("Error loading feature flags:", err);
    } finally {
      setLoadingFlags(false);
    }
  };

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const data = await getUnmappedRecords();
      setRecords(data);
    } catch (err) {
      console.error("Error loading unmapped records:", err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleToggleFlag = async (flagKey: string, enabled: boolean) => {
    const result = await toggleFeatureFlag(flagKey, enabled);

    if (result.success) {
      toast({
        title: enabled ? "Feature Enabled" : "Feature Disabled",
        description: `${flagKey} has been ${enabled ? "enabled" : "disabled"}`,
      });
      await loadFlags();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to toggle feature flag",
        variant: "destructive",
      });
    }
  };

  const handleRerunBackfill = async () => {
    toast({
      title: "Running Backfill",
      description: "Re-running category and payment method backfill for unmapped records...",
    });

    const [categoryResult, paymentMethodResult] = await Promise.all([
      rerunCategoryBackfill(),
      rerunPaymentMethodBackfill(),
    ]);

    let successMessage = "";
    let hasError = false;

    if (categoryResult.success) {
      successMessage += `Categories: ${categoryResult.mapped_count} mapped. `;
    } else {
      hasError = true;
      successMessage += `Categories: ${categoryResult.error}. `;
    }

    if (paymentMethodResult.success) {
      successMessage += `Payment Methods: ${paymentMethodResult.mapped_count} mapped.`;
    } else {
      hasError = true;
      successMessage += `Payment Methods: ${paymentMethodResult.error}.`;
    }

    toast({
      title: hasError ? "Backfill Completed with Errors" : "Backfill Completed",
      description: successMessage,
      variant: hasError ? "destructive" : "default",
    });

    // Reload data
    await loadAllData();
  };

  const handleFixRecord = (record: UnmappedRecord) => {
    setSelectedRecord(record);
  };

  const handleFixSuccess = async () => {
    toast({
      title: "Record Fixed",
      description: "The unmapped record has been successfully fixed",
    });
    await loadAllData();
  };

  const handleDownloadCSV = () => {
    downloadReportAsCSV(records);
    toast({
      title: "Download Started",
      description: "Migration report CSV is being downloaded",
    });
  };

  const handleDownloadJSON = () => {
    downloadReportAsJSON(records);
    toast({
      title: "Download Started",
      description: "Migration report JSON is being downloaded",
    });
  };

  // Loading state
  if (loadingHealth && loadingFlags && loadingRecords) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading migration dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={loadAllData}>Retry</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Migration Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor migration health, fix unmapped records, and control feature rollout
          </p>
        </div>

        {/* Migration Health Overview */}
        <MigrationHealthCard
          health={health}
          loading={loadingHealth}
          onRefresh={loadHealth}
          onDownloadReport={handleDownloadCSV}
          onRerunBackfill={handleRerunBackfill}
        />

        {/* Tabs */}
        <Tabs defaultValue="records" className="space-y-6">
          <TabsList>
            <TabsTrigger value="records">Unmapped Records</TabsTrigger>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          </TabsList>

          {/* Unmapped Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <MigrationReportTable
              records={records}
              loading={loadingRecords}
              onRefresh={loadRecords}
              onFixRecord={handleFixRecord}
              onDownloadCSV={handleDownloadCSV}
              onDownloadJSON={handleDownloadJSON}
            />
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="flags" className="space-y-6">
            <FeatureFlagControl flags={flags} loading={loadingFlags} onToggle={handleToggleFlag} />
          </TabsContent>
        </Tabs>

        {/* Fix Record Dialog */}
        <UnmappedRecordFixer
          record={selectedRecord}
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onSuccess={handleFixSuccess}
        />
      </div>
    </AdminLayout>
  );
}