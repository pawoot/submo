import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  getMigrationReportById, 
  getUnmappedRecordsDetailed,
  downloadReportAsCSV,
  downloadReportAsJSON,
  type MigrationReport,
  type UnmappedRecordDetailed
} from "@/services/adminMigrationService";
import { ArrowLeft, Download, Filter, Search, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function MigrationReportDetailPage() {
  const router = useRouter();
  const { reportId } = router.query;

  const [report, setReport] = useState<MigrationReport | null>(null);
  const [records, setRecords] = useState<UnmappedRecordDetailed[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<UnmappedRecordDetailed[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");

  useEffect(() => {
    if (reportId && typeof reportId === "string") {
      loadReportData();
    }
  }, [reportId]);

  useEffect(() => {
    applyFilters();
  }, [records, searchTerm, entityFilter, issueTypeFilter, statusFilter]);

  async function loadReportData() {
    setLoading(true);
    try {
      const [reportData, recordsData] = await Promise.all([
        getMigrationReportById(reportId as string),
        getUnmappedRecordsDetailed({
          report_id: reportId as string,
        }),
      ]);

      setReport(reportData);
      setRecords(recordsData);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast({
        title: "Error",
        description: "Failed to load migration report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...records];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.subscription_name?.toLowerCase().includes(term) ||
          r.legacy_value?.toLowerCase().includes(term) ||
          r.current_mapped_value?.toLowerCase().includes(term)
      );
    }

    // Entity filter
    if (entityFilter !== "all") {
      filtered = filtered.filter((r) => r.entity === entityFilter);
    }

    // Issue type filter
    if (issueTypeFilter !== "all") {
      filtered = filtered.filter((r) => r.issue_type === issueTypeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }

  function handleExportCSV() {
    downloadReportAsCSV(
      filteredRecords.map(r => ({
        id: r.id,
        entity: r.entity,
        issue_type: r.issue_type,
        subscription_name: r.subscription_name,
        legacy_value: r.legacy_value,
        current_mapped_value: r.current_mapped_value,
        created_at: r.created_at,
        status: r.status,
        record_id: r.record_id,
      })),
      `migration-report-${reportId}.csv`
    );
    toast({
      title: "Export Successful",
      description: "Report downloaded as CSV",
    });
  }

  function handleExportJSON() {
    downloadReportAsJSON(
      filteredRecords.map(r => ({
        id: r.id,
        entity: r.entity,
        issue_type: r.issue_type,
        subscription_name: r.subscription_name,
        legacy_value: r.legacy_value,
        current_mapped_value: r.current_mapped_value,
        created_at: r.created_at,
        status: r.status,
        record_id: r.record_id,
      })),
      `migration-report-${reportId}.json`
    );
    toast({
      title: "Export Successful",
      description: "Report downloaded as JSON",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "resolved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case "unresolved":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Unresolved</Badge>;
      case "in_progress":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getIssueTypeBadge(issueType: string) {
    const colors: Record<string, string> = {
      unmapped_category: "bg-orange-500",
      unmapped_payment_method: "bg-blue-500",
      invalid_shared_with: "bg-purple-500",
      unmapped_reminder: "bg-yellow-500",
    };

    return (
      <Badge className={colors[issueType] || "bg-gray-500"}>
        {issueType.replace(/_/g, " ")}
      </Badge>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-4">The migration report you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/admin/migration-dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const uniqueEntities = Array.from(new Set(records.map((r) => r.entity)));
  const uniqueIssueTypes = Array.from(new Set(records.map((r) => r.issue_type)));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/admin/migration-dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{report.migration_name}</h1>
              <p className="text-muted-foreground">
                Generated {format(new Date(report.generated_at), "PPpp")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {records.filter((r) => r.status === "unresolved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {records.filter((r) => r.status === "resolved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.length > 0
                  ? Math.round((records.filter((r) => r.status === "resolved").length / records.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter and search unmapped records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {uniqueEntities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Issue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  {uniqueIssueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredRecords.length} of {records.length} records
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Unmapped Records</CardTitle>
            <CardDescription>
              Click on a row to view details and fix issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Legacy Value</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No records found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.entity}</TableCell>
                        <TableCell>{getIssueTypeBadge(record.issue_type)}</TableCell>
                        <TableCell>{record.subscription_name || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.legacy_value || "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.current_mapped_value || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(record.created_at), "PP")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {record.issue_type === "unmapped_category" && (
                              <Button size="sm" variant="outline">
                                Fix Category
                              </Button>
                            )}
                            {record.issue_type === "unmapped_payment_method" && (
                              <Button size="sm" variant="outline">
                                Fix Payment
                              </Button>
                            )}
                            {record.status === "unresolved" && (
                              <Button size="sm" variant="ghost">
                                Mark Resolved
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}