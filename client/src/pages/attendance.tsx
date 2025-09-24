import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, RefreshCcw, Download } from "lucide-react";
import { useEmployees } from "@/hooks/use-employees";
import { useToast } from "@/hooks/use-toast";
import { getAllAttendance, type AttendanceRecord, type ComprehensiveAnalytics } from "@/lib/attendance";

// Helpers
const formatTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString() : "-");
const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "-");

export default function AttendancePage() {
  const ALL_EMP_VALUE = "__ALL__";
  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { toast } = useToast();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<Array<{
    date: string;
    total_employees: number;
    present: number;
    late: number;
    absent: number;
    checked_out: number;
    still_checked_in: number;
    total_hours_worked: number;
    average_hours_per_employee: number;
  }>>([]);

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.employee_id, e])), [employees]);
  const selectedEmployee = selectedEmployeeId ? employeeMap.get(selectedEmployeeId) : undefined;

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const resp = await getAllAttendance({
        page: 1,
        limit: 20,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        employee_id: selectedEmployeeId || undefined,
        status: status !== 'all' ? status : undefined,
        include_analytics: true,
        include_trends: true,
      });
      setRows(resp.attendance_records);
      setAnalytics(resp.comprehensive_analytics || null);
      setDailyBreakdown(resp.daily_breakdown || []);
      toast({ title: "Attendance loaded", description: `${resp.pagination?.total_items ?? resp.attendance_records.length} records retrieved.` });
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message || "Could not fetch attendance", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!rows.length) {
      toast({ title: "No data", description: "Load attendance first.", variant: "destructive" });
      return;
    }
    const headers = ["attendance_id","employee_id","date","check_in_time","check_out_time","hours_worked","status","qr_code_scanned","created_at","updated_at"];
    const toCsvValue = (v: unknown) => `"${(v ?? "").toString().replace(/"/g,'""')}"`;
    const csv = [headers, ...rows.map(r => [r.attendance_id, r.employee_id, r.date, r.check_in_time, r.check_out_time, r.hours_worked ?? "", r.status, r.qr_code_scanned ?? "", r.created_at, r.updated_at ?? ""])].map(r => r.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedEmployeeId || "all"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filtered = rows.filter((r) => {
    const q = query.toLowerCase();
    const emp = employeeMap.get(r.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : r.employee_id.toLowerCase();
    const matchesQuery = !q || empName.includes(q);
    const matchesStatus = status === "all" || r.status.toLowerCase() === status;
    return matchesQuery && matchesStatus;
  });

  // Compute cards from daily_breakdown for selected day (endDate or today)
  const targetDay = (endDate || new Date().toISOString().slice(0,10));
  const dayRow = dailyBreakdown.find(d => d.date === targetDay);
  const presentCount = dayRow?.present ?? filtered.length;
  const lateCount = dayRow?.late ?? 0;
  const absentCount = dayRow?.absent ?? 0;

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-2">Track employee daily attendance and punctuality.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={loading || isLoadingEmployees}>
              <RefreshCcw className={"w-4 h-4" + (loading ? " animate-spin" : "")} /> {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button className="gap-2" onClick={handleExport} disabled={!filtered.length}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Search</label>
                <Input placeholder="Search employee..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Employee (optional)</label>
                <Select value={selectedEmployeeId || ALL_EMP_VALUE} onValueChange={(v) => setSelectedEmployeeId(v === ALL_EMP_VALUE ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "All employees"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_EMP_VALUE}>All employees</SelectItem>
                    {employees.map(e => (
                      <SelectItem key={e.employee_id} value={e.employee_id}>
                        {e.first_name} {e.last_name} ({e.employee_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date" />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End date" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{presentCount}</div>
              <p className="text-sm text-muted-foreground mt-2">Employees present today</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{lateCount}</div>
              <p className="text-sm text-muted-foreground mt-2">Arrived after start time</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{absentCount}</div>
              <p className="text-sm text-muted-foreground mt-2">Not checked in today</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              Attendance {selectedEmployee ? `– ${selectedEmployee.first_name} ${selectedEmployee.last_name}` : "(All)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Check-in</th>
                    <th className="text-left p-4 font-medium">Check-out</th>
                    <th className="text-left p-4 font-medium">Hours</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const emp = employeeMap.get(r.employee_id);
                    const name = r.employee_name || (emp ? `${emp.first_name} ${emp.last_name}` : r.employee_id);
                    const dept = r.department || emp?.department || "-";
                    const badgeClass = r.status === 'checked_out'
                      ? 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-700'
                      : 'px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700';
                    return (
                      <tr key={r.attendance_id} className="border-b last:border-b-0">
                        <td className="p-4 font-medium">{name}</td>
                        <td className="p-4">{dept}</td>
                        <td className="p-4">
                          <span className={badgeClass}>{r.status}</span>
                        </td>
                        <td className="p-4">{formatTime(r.check_in_time)}</td>
                        <td className="p-4">{formatTime(r.check_out_time)}</td>
                        <td className="p-4">{r.hours_worked ?? '-'}</td>
                        <td className="p-4">{formatDate(r.date)}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-6 text-muted-foreground" colSpan={7}>
                        No attendance records for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
