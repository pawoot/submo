import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { MappedSubscription } from "@/services/importService";

interface ImportReviewTableProps {
  subscriptions: MappedSubscription[];
  onConfirm: (selected: MappedSubscription[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ImportReviewTable({
  subscriptions,
  onConfirm,
  onCancel,
  isLoading = false,
}: ImportReviewTableProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(subscriptions.map((s) => s.id))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<MappedSubscription[]>(
    subscriptions
  );

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === editedData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(editedData.map((s) => s.id)));
    }
  };

  const handleEdit = (id: string, field: keyof MappedSubscription, value: any) => {
    setEditedData((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, [field]: value } : sub))
    );
  };

  const handleDelete = (id: string) => {
    setEditedData((prev) => prev.filter((sub) => sub.id !== id));
    const newSelected = new Set(selected);
    newSelected.delete(id);
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const selectedSubs = editedData.filter((sub) => selected.has(sub.id));
    onConfirm(selectedSubs);
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    const colors = {
      high: "bg-green-500/10 text-green-700 dark:text-green-400",
      medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      low: "bg-red-500/10 text-red-700 dark:text-red-400",
    };
    return (
      <Badge className={colors[confidence]} variant="outline">
        {confidence === "high" && "✓ Confident"}
        {confidence === "medium" && "~ Maybe"}
        {confidence === "low" && "? Uncertain"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Imported Subscriptions</h3>
          <p className="text-sm text-muted-foreground">
            {selected.size} of {editedData.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.size === 0 || isLoading}
          >
            {isLoading ? "Importing..." : `Import ${selected.size} Subscription${selected.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selected.size === editedData.length && editedData.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No subscriptions to review
                </TableCell>
              </TableRow>
            ) : (
              editedData.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(sub.id)}
                      onCheckedChange={() => toggleSelection(sub.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === sub.id ? (
                      <Input
                        value={sub.name}
                        onChange={(e) => handleEdit(sub.id, "name", e.target.value)}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="max-w-xs"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sub.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setEditingId(sub.id)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {sub.rawTransaction.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    {editingId === sub.id ? (
                      <Input
                        type="number"
                        value={sub.amount}
                        onChange={(e) =>
                          handleEdit(sub.id, "amount", parseFloat(e.target.value))
                        }
                        onBlur={() => setEditingId(null)}
                        className="max-w-24"
                      />
                    ) : (
                      <span className="font-semibold">฿{sub.amount.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>{sub.next_billing_date}</TableCell>
                  <TableCell>{getConfidenceBadge(sub.confidence)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleDelete(sub.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">💡 Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Click the pencil icon to edit subscription names or amounts</li>
          <li>• Uncheck items that aren&apos;t subscriptions (e.g., one-time purchases)</li>
          <li>• High confidence items are automatically matched to known services</li>
        </ul>
      </div>
    </div>
  );
}