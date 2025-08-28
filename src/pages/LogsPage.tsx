import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Download, Filter } from "lucide-react";
import { useActivityLogs } from "@/context/ActivityLogContext";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { showError, showSuccess } from "@/utils/toast";

const LogsPage: React.FC = () => {
  const { activityLogs, fetchActivityLogs, isLoadingLogs } = useActivityLogs();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    fetchActivityLogs(dateRange);
  }, [dateRange, fetchActivityLogs]);

  const handleClearDateFilter = () => {
    setDateRange(undefined);
  };

  const handleExportLogs = () => {
    if (activityLogs.length === 0) {
      showError("No logs to export.");
      return;
    }

    const header = "Timestamp,User,Activity Type,Description,Details\n";
    const csvContent = activityLogs.map(log => {
      const timestamp = format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss");
      const user = log.userName || "N/A";
      const activityType = log.activityType.replace(/"/g, '""');
      const description = log.description.replace(/"/g, '""');
      const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
      return `"${timestamp}","${user}","${activityType}","${description}","${details}"`;
    }).join("\n");

    const fullCsv = header + csvContent;
    const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `activity_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Activity logs exported successfully!");
    } else {
      showError("Your browser does not support downloading files directly.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <History className="h-8 w-8 text-primary" /> Activity Logs
      </h1>
      <p className="text-muted-foreground">
        View and export a detailed history of all user and system activities.
      </p>

      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Log Filter & Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            {dateRange?.from && (
              <Button variant="outline" onClick={handleClearDateFilter}>
                Clear Filter
              </Button>
            )}
          </div>
          <Button onClick={handleExportLogs} disabled={activityLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export to CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <p className="text-center text-muted-foreground py-8">Loading activity logs...</p>
          ) : activityLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity logs found for the selected period.</p>
          ) : (
            <ScrollArea className="h-[500px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[200px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}</TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>{log.activityType}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                        {JSON.stringify(log.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;