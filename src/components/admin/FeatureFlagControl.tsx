import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import type { FeatureFlag } from "@/services/adminMigrationService";

interface FeatureFlagControlProps {
  flags: FeatureFlag[];
  loading: boolean;
  onToggle: (flagKey: string, enabled: boolean) => Promise<void>;
}

export function FeatureFlagControl({ flags, loading, onToggle }: FeatureFlagControlProps) {
  const [pendingToggle, setPendingToggle] = useState<{ key: string; enabled: boolean } | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleClick = (flag: FeatureFlag, newValue: boolean) => {
    // If disabling a live flag, show confirmation
    if (flag.enabled && !newValue) {
      setPendingToggle({ key: flag.key, enabled: newValue });
    } else {
      handleConfirmedToggle(flag.key, newValue);
    }
  };

  const handleConfirmedToggle = async (key: string, enabled: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(key, enabled);
      setPendingToggle(null);
    } finally {
      setIsToggling(false);
    }
  };

  const getFlagDescription = (key: string): string => {
    switch (key) {
      case "use_new_dashboard_reads":
        return "Switch dashboard queries to use new schema (category_id, payment_method_id, status)";
      case "use_new_subscription_reads":
        return "Use new subscription list queries with normalized fields";
      case "use_new_shares_model":
        return "Read sharing data from subscription_shares table instead of shared_with array";
      case "use_new_reminders_model":
        return "Use reminder_enabled_v2 and reminder_days_array for notifications";
      default:
        return "Feature flag for gradual rollout";
    }
  };

  const getImpactWarning = (key: string): string => {
    switch (key) {
      case "use_new_dashboard_reads":
        return "Disabling this flag will revert dashboard to legacy category/payment_method text fields. Users may see different data temporarily.";
      case "use_new_subscription_reads":
        return "Disabling will revert subscription lists to legacy schema. This may affect filtering and sorting.";
      case "use_new_shares_model":
        return "Disabling will revert to reading shared_with array. Shared subscriptions may behave differently.";
      case "use_new_reminders_model":
        return "Disabling will use old reminder fields. Notification timing may change.";
      default:
        return "Disabling this flag may affect application behavior.";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Control migration feature rollout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Toggle features for gradual rollout or instant rollback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Feature flags allow you to enable/disable new schema usage without code deployment.
              Disabling a flag instantly reverts to legacy behavior.
            </AlertDescription>
          </Alert>

          {flags.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No feature flags found. Run Phase 0 migration first.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {flags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {flag.key}
                      </code>
                      <Badge variant={flag.enabled ? "default" : "secondary"}>
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {flag.rollout_percentage < 100 && (
                        <Badge variant="outline">{flag.rollout_percentage}% rollout</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {flag.description || getFlagDescription(flag.key)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(flag.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(checked) => handleToggleClick(flag, checked)}
                    disabled={isToggling}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingToggle} onOpenChange={() => setPendingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Disable Feature Flag?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to disable:</p>
              <code className="block bg-muted px-3 py-2 rounded text-sm">
                {pendingToggle?.key}
              </code>
              <p className="font-medium text-foreground">
                {pendingToggle && getImpactWarning(pendingToggle.key)}
              </p>
              <p>This change takes effect immediately for all users.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingToggle && handleConfirmedToggle(pendingToggle.key, pendingToggle.enabled)}
              disabled={isToggling}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isToggling ? "Disabling..." : "Confirm Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}