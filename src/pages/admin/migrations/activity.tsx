import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileText, Filter, Calendar, User, Activity } from "lucide-react";
import { format } from "date-fns";
import { getAdminActionLogs, AdminActionLog } from "@/services/adminMigrationService";
import { useToast } from "@/hooks/use-toast";

export default function AdminAuditLogViewer() {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [adminUserFilter, setAdminUserFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // Diff preview dialog
  const [diffDialog, setDiffDialog] = useState<{
    open: boolean;
    log: AdminActionLog | null;
  }>({ open: false, log: null });

  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, actionTypeFilter, adminUserFilter, dateFromFilter, dateToFilter]);

  async function loadAuditLogs() {
    setLoading(true);
    try {
      const result = await getAdminActionLogs(currentPage, pageSize, {
        action_type: actionTypeFilter || undefined,
        admin_user_id: adminUserFilter || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
      });

      setLogs(result.data);
      setTotalCount(result.count);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setActionTypeFilter("");
    setAdminUserFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setCurrentPage(1);
  }

  function getActionTypeBadgeColor(actionType: string) {
    const colors: Record<string, string> = {
      fix_category: "bg-orange-100 text-orange-800 border-orange-200",
      fix_payment_method: "bg-blue-100 text-blue-800 border-blue-200",
      mark_resolved: "bg-green-100 text-green-800 border-green-200",
      bulk_update: "bg-purple-100 text-purple-800 border-purple-200",
      create_category: "bg-yellow-100 text-yellow-800 border-yellow-200",
      create_payment_method: "bg-cyan-100 text-cyan-800 border-cyan-200",
    };
    return colors[actionType] || "bg-gray-100 text-gray-800 border-gray-200";
  }

  function viewDiff(log: AdminActionLog) {
    setDiffDialog({ open: true, log });
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
          <p className="text-muted-foreground">
            View all admin actions and changes made to subscription data
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter audit logs by action type, admin user, or date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action-type">Action Type</Label>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger id="action-type">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="fix_category">Fix Category</SelectItem>
                    <SelectItem value="fix_payment_method">Fix Payment Method</SelectItem>
                    <SelectItem value="mark_resolved">Mark Resolved</SelectItem>
                    <SelectItem value="bulk_update">Bulk Update</SelectItem>
                    <SelectItem value="create_category">Create Category</SelectItem>
                    <SelectItem value="create_payment_method">Create Payment Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-user">Admin User ID</Label>
                <Input
                  id="admin-user"
                  placeholder="Filter by user ID..."
                  value={adminUserFilter}
                  onChange={(e) => setAdminUserFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">Date To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button onClick={() => loadAuditLogs()}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Admin Actions ({totalCount} total)
            </CardTitle>
            <CardDescription>
              Showing {logs.length} of {totalCount} audit log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Admin User</TableHead>
                        <TableHead>Action Type</TableHead>
                        <TableHead>Target Entity</TableHead>
                        <TableHead>Target ID</TableHead>
                        <TableHead>Affected Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-xs truncate max-w-[100px]">
                                {log.admin_user_id.substring(0, 8)}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionTypeBadgeColor(log.action_type)}>
                              {log.action_type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{log.target_entity}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.target_id ? (
                              <span className="truncate max-w-[100px] inline-block">
                                {log.target_id.substring(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.affected_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDiff(log)}
                            >
                              View Diff
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Diff Preview Dialog */}
        <Dialog open={diffDialog.open} onOpenChange={(open) => setDiffDialog({ open, log: null })}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Action Details</DialogTitle>
              <DialogDescription>
                Before and after state comparison
              </DialogDescription>
            </DialogHeader>

            {diffDialog.log && (
              <div className="space-y-4">
                {/* Action Summary */}
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Action Type:</span>{" "}
                      <Badge className={getActionTypeBadgeColor(diffDialog.log.action_type)}>
                        {diffDialog.log.action_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Timestamp:</span>{" "}
                      {format(new Date(diffDialog.log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </div>
                    <div>
                      <span className="font-semibold">Target Entity:</span>{" "}
                      {diffDialog.log.target_entity}
                    </div>
                    <div>
                      <span className="font-semibold">Affected Count:</span>{" "}
                      {diffDialog.log.affected_count}
                    </div>
                  </div>
                </div>

                {/* Before/After Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-red-600">Before</span>
                    </h3>
                    <div className="rounded-lg border p-4 bg-red-50">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(diffDialog.log.before_state, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-green-600">After</span>
                    </h3>
                    <div className="rounded-lg border p-4 bg-green-50">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(diffDialog.log.after_state, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {diffDialog.log.metadata && Object.keys(diffDialog.log.metadata).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Metadata</h3>
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(diffDialog.log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}