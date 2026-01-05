import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, CalendarIcon, Download, RefreshCw, Wrench } from "lucide-react";
import { format } from "date-fns";
import type { UnmappedRecord } from "@/services/adminMigrationService";

interface MigrationReportTableProps {
  records: UnmappedRecord[];
  loading: boolean;
  onRefresh: () => void;
  onFixRecord: (record: UnmappedRecord) => void;
  onDownloadCSV: () => void;
  onDownloadJSON: () => void;
}

export function MigrationReportTable({
  records,
  loading,
  onRefresh,
  onFixRecord,
  onDownloadCSV,
  onDownloadJSON,
}: MigrationReportTableProps) {
  const [filters, setFilters] = useState({
    entity: "all",
    issue_type: "all",
    status: "all",
    search: "",
    date_from: undefined as Date | undefined,
    date_to: undefined as Date | undefined,
  });

  const filteredRecords = records.filter((record) => {
    if (filters.entity !== "all" && record.entity !== filters.entity) return false;
    if (filters.issue_type !== "all" && record.issue_type !== filters.issue_type) return false;
    if (filters.status !== "all" && record.status !== filters.status) return false;
    if (
      filters.search &&
      !record.subscription_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !record.legacy_value?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    if (filters.date_from && new Date(record.created_at) < filters.date_from) return false;
    if (filters.date_to && new Date(record.created_at) > filters.date_to) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="default">Resolved</Badge>;
      case "unresolved":
        return <Badge variant="destructive">Unresolved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    switch (issueType) {
      case "unmapped_category":
        return <Badge variant="outline">Unmapped Category</Badge>;
      case "unmapped_payment_method":
        return <Badge variant="outline">Unmapped Payment Method</Badge>;
      case "invalid_shared_with":
        return <Badge variant="destructive">Invalid Share</Badge>;
      default:
        return <Badge variant="outline">{issueType}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migration Report Details</CardTitle>
          <CardDescription>Loading unmapped records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Migration Report Details</CardTitle>
            <CardDescription>
              {filteredRecords.length} of {records.length} records
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadJSON}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search subscription name or legacy value..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <Select value={filters.entity} onValueChange={(value) => setFilters({ ...filters, entity: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="subscriptions">Subscriptions</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
              <SelectItem value="payment_methods">Payment Methods</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.issue_type}
            onValueChange={(value) => setFilters({ ...filters, issue_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Issue Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="unmapped_category">Unmapped Category</SelectItem>
              <SelectItem value="unmapped_payment_method">Unmapped Payment Method</SelectItem>
              <SelectItem value="invalid_shared_with">Invalid Share</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date_from ? format(filters.date_from, "PPP") : "Date From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.date_from}
                onSelect={(date) => setFilters({ ...filters, date_from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No unmapped records found</p>
            <p className="text-sm">All records have been successfully mapped!</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.entity}</TableCell>
                    <TableCell>{getIssueTypeBadge(record.issue_type)}</TableCell>
                    <TableCell>{record.subscription_name || "-"}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {record.legacy_value || "-"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {record.current_mapped_value || "-"}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.status === "unresolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onFixRecord(record)}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          Fix
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}