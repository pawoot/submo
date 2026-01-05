import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Download, RefreshCw } from "lucide-react";
import type { MigrationHealth } from "@/services/adminMigrationService";

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
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migration Health</CardTitle>
          <CardDescription>Loading migration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migration Health</CardTitle>
          <CardDescription>Unable to load migration data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch migration health. Please check database connection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (health.status) {
      case "healthy":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Healthy
          </Badge>
        );
      case "needs_attention":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Needs Attention
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case "healthy":
        return "text-green-600";
      case "needs_attention":
        return "text-red-600";
      case "in_progress":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Migration Health
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              Last checked: {new Date(health.checked_at).toLocaleString()}
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
          <div>
            <p className="text-sm text-muted-foreground">Total Subscriptions</p>
            <p className="text-2xl font-bold">{health.total_subscriptions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {health.successfully_mapped_percent.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unmapped Categories</p>
            <p className="text-2xl font-bold text-orange-600">{health.unmapped_categories}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unmapped Payment Methods</p>
            <p className="text-2xl font-bold text-orange-600">
              {health.unmapped_payment_methods}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Migration Progress</span>
            <span className="font-medium">{health.successfully_mapped_percent.toFixed(1)}%</span>
          </div>
          <Progress value={health.successfully_mapped_percent} className="h-2" />
        </div>

        {/* Issues Summary */}
        {health.unresolved_issues > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{health.unresolved_issues}</strong> unresolved issues found
              {health.invalid_shared_with > 0 && (
                <span> (including {health.invalid_shared_with} invalid share records)</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="default" onClick={onRerunBackfill} disabled={health.unresolved_issues === 0}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run Backfill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}