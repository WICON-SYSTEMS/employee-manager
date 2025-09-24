import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, BarChart3, Download, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getComprehensiveAnalytics, type ComprehensiveAnalytics } from "@/lib/attendance";

type SimpleDateRange = { from?: string; to?: string };

export default function ReportsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<SimpleDateRange | undefined>({
    from: new Date().toISOString().slice(0,10).replace(/-\d{2}$/, "-01"),
    to: new Date().toISOString().slice(0,10),
  });
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const data = await getComprehensiveAnalytics(range?.from, range?.to);
      setAnalytics(data);
      toast({ title: "Reports loaded", description: `Period ${data.period.start_date} to ${data.period.end_date}` });
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message || "Could not fetch analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on initial mount
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    if (!analytics) {
      toast({ title: "No data", description: "Generate the report first.", variant: "destructive" });
      return;
    }
    const rows = analytics.employee_stats;
    const headers = [
      "employee_id","employee_name","employee_code","department","total_days_present","total_days_late","total_days_absent","total_days_partial","total_hours_worked","average_hours_per_day","attendance_percentage","punctuality_percentage","last_attendance_date","current_status","working_days_in_period"
    ];
    const toCsvValue = (v: unknown) => `"${(v ?? "").toString().replace(/"/g,'""')}"`;
    const csv = [headers, ...rows.map(r => [
      r.employee_id,
      r.employee_name,
      r.employee_code,
      r.department,
      r.total_days_present,
      r.total_days_late,
      r.total_days_absent,
      r.total_days_partial,
      r.total_hours_worked,
      r.average_hours_per_day,
      r.attendance_percentage,
      r.punctuality_percentage,
      r.last_attendance_date ?? "",
      r.current_status,
      r.working_days_in_period,
    ])].map(r => r.map(toCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${analytics.period.start_date}_${analytics.period.end_date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filtered = (analytics?.employee_stats || []).filter((row) => {
    const q = query.toLowerCase();
    return !q || row.employee_name.toLowerCase().includes(q) || row.employee_code.toLowerCase().includes(q) || row.department.toLowerCase().includes(q);
  });

  const kpi = analytics?.overall_summary;

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-2">Generate attendance and productivity summaries.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleGenerate} disabled={loading}>
              <RefreshCcw className={"w-4 h-4" + (loading ? " animate-spin" : "")} /> {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button className="gap-2" onClick={handleExport} disabled={!analytics}>
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
              <div className="lg:col-span-2">
                <label className="text-sm text-muted-foreground">Date range</label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={range?.from || ""} onChange={(e) => setRange(r => ({ ...(r||{}), from: e.target.value }))} />
                  <Input type="date" value={range?.to || ""} onChange={(e) => setRange(r => ({ ...(r||{}), to: e.target.value }))} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pick a start and end date then click Generate.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi?.total_employees ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-2">In this period</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Present Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{kpi?.total_present_days ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Total attendance days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Late Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{kpi?.total_late_days ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Late arrivals</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Absent Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{kpi?.total_absent_days ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Unexcused absences</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Total Hours Worked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi?.total_hours_worked ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Sum of hours in period</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi?.overall_attendance_rate ?? 0}%</div>
              <p className="text-sm text-muted-foreground mt-2">Across all employees</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Punctuality Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi?.overall_punctuality_rate ?? 0}%</div>
              <p className="text-sm text-muted-foreground mt-2">Across all employees</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Days Present</th>
                    <th className="text-left p-4 font-medium">Days Late</th>
                    <th className="text-left p-4 font-medium">Days Absent</th>
                    <th className="text-left p-4 font-medium">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.employee_id} className="border-b last:border-b-0">
                      <td className="p-4 font-medium">{row.employee_name} ({row.employee_code})</td>
                      <td className="p-4">{row.department}</td>
                      <td className="p-4">{row.total_days_present}</td>
                      <td className="p-4">{row.total_days_late}</td>
                      <td className="p-4">{row.total_days_absent}</td>
                      <td className="p-4">{row.total_hours_worked}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-6 text-muted-foreground" colSpan={6}>
                        No report data for the selected filters.
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
