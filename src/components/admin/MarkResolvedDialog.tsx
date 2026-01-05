import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { markRecordResolved } from "@/services/adminMigrationService";
import { useToast } from "@/hooks/use-toast";

interface MarkResolvedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  subscriptionName: string;
  issueType: string;
  onSuccess: () => void;
}

export function MarkResolvedDialog({
  open,
  onOpenChange,
  recordId,
  subscriptionName,
  issueType,
  onSuccess,
}: MarkResolvedDialogProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleMarkResolved() {
    if (!note.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a resolution note",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to mark records as resolved",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const result = await markRecordResolved(recordId, user.id, note);

    if (result.success) {
      toast({
        title: "Record Marked Resolved",
        description: `Successfully marked "${subscriptionName}" as resolved`,
      });
      onSuccess();
      onOpenChange(false);
      setNote("");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to mark record as resolved",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark as Resolved</DialogTitle>
          <DialogDescription>
            Mark this issue as resolved for <strong>{subscriptionName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Issue Type</p>
                <p className="text-sm text-yellow-700">{issueType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Resolution Note *</Label>
            <Textarea
              id="note"
              placeholder="Explain how this issue was resolved (e.g., 'Manually updated category via admin panel', 'Verified data is correct, no action needed')"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This note will be logged for audit purposes
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleMarkResolved} disabled={loading || !note.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}