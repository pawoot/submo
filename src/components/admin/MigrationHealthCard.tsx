import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Download, RefreshCw } from "lucide-react";
import type { MigrationHealth } from "@/services/adminMigrationService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface MigrationHealthCardProps {
  health: MigrationHealth | null;
  loading: boolean;
  onRefresh: () => void;
  onDownloadReport: () => void;
  onRerunBackfill: () => void;
}

export function MigrationHealthCard({
  health,
  loading,
  onRefresh,
  onDownloadReport,
  onRerunBackfill,
}: MigrationHealthCardProps) {
  const { toast } = useToast();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migration Health</CardTitle>
          <CardDescription>Loading migration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe access to health properties with defaults
  const totalSubs = health?.total_subscriptions ?? 0;
  const successPercent = health?.successfully_mapped_percent ?? 0;
  const unmappedCats = health?.unmapped_categories ?? 0;
  const unmappedPms = health?.unmapped_payment_methods ?? 0;
  const invalidShared = health?.invalid_shared_with ?? 0;
  const status = health?.status ?? "unknown";
  const issuesCount = unmappedCats + unmappedPms + invalidShared;
  const successMapped = health?.successfully_mapped ?? 0;

  const getStatusBadge = () => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3" />
            Healthy
          </Badge>
        );
      case "needs_attention":
        return (
          <Badge variant="secondary" className="gap-1 text-yellow-600 bg-yellow-100 hover:bg-yellow-200">
            <AlertCircle className="h-3 w-3" />
            Needs Attention
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Critical
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "needs_attention":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle>Migration Health</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>
              {health?.last_report_created_at
                ? `Last checked: ${new Date(health.last_report_created_at).toLocaleString()}`
                : "No reports generated yet"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Subscriptions</p>
            <p className="text-2xl font-bold">{totalSubs.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {successPercent.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Unmapped Categories</p>
            <p className={`text-2xl font-bold ${unmappedCats > 0 ? "text-orange-600" : ""}`}>
              {unmappedCats.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Unmapped Payments</p>
            <p className={`text-2xl font-bold ${unmappedPms > 0 ? "text-orange-600" : ""}`}>
              {unmappedPms.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Migration Progress</span>
            <span className="text-muted-foreground">
              {successMapped} / {totalSubs}
            </span>
          </div>
          <Progress value={successPercent} className="h-2" />
        </div>

        {/* Issues Summary */}
        {issuesCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-1">
              <span className="font-semibold">{issuesCount} issues require attention:</span>
              <ul className="list-disc list-inside text-xs opacity-90">
                {unmappedCats > 0 && <li>{unmappedCats} unmapped categories</li>}
                {unmappedPms > 0 && <li>{unmappedPms} unmapped payment methods</li>}
                {invalidShared > 0 && <li>{invalidShared} invalid shared records</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onDownloadReport} disabled={!health}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button 
            variant="default" 
            onClick={onRerunBackfill} 
            disabled={!health || issuesCount === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run Backfill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}