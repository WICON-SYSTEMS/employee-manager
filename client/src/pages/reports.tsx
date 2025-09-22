import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, BarChart3, Download } from "lucide-react";

// Temporary mock data for reports until reporting endpoints are available
const mockReportRows = [
  { id: "1", employee: "Alex Smith", department: "Engineering", daysPresent: 20, daysLate: 2, daysAbsent: 1, hours: 168 },
  { id: "2", employee: "Jane Doe", department: "HR", daysPresent: 19, daysLate: 1, daysAbsent: 3, hours: 152 },
  { id: "3", employee: "Michael Chen", department: "Engineering", daysPresent: 21, daysLate: 0, daysAbsent: 1, hours: 176 },
  { id: "4", employee: "Sarah Johnson", department: "Finance", daysPresent: 18, daysLate: 3, daysAbsent: 3, hours: 144 },
];

type SimpleDateRange = { from?: Date; to?: Date };

export default function ReportsPage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [range, setRange] = useState<SimpleDateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const filtered = mockReportRows.filter((row) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || row.employee.toLowerCase().includes(q);
    const matchesDept = department === "all" || row.department === department;
    return matchesQuery && matchesDept;
  });

  const totalHours = filtered.reduce((sum, r) => sum + r.hours, 0);
  const totalPresent = filtered.reduce((sum, r) => sum + r.daysPresent, 0);
  const totalLate = filtered.reduce((sum, r) => sum + r.daysLate, 0);
  const totalAbsent = filtered.reduce((sum, r) => sum + r.daysAbsent, 0);

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
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Generate
            </Button>
            <Button className="gap-2">
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
                <label className="text-sm text-muted-foreground">Department</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm text-muted-foreground">Date range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={`${range?.from?.toLocaleDateString() ?? ""} - ${range?.to?.toLocaleDateString() ?? ""}`}
                  />
                  <Button variant="outline" size="icon">
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Interactive date picker coming soon.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours}</div>
              <p className="text-sm text-muted-foreground mt-2">Sum of hours in range</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Days Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totalPresent}</div>
              <p className="text-sm text-muted-foreground mt-2">Total attendance days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Days Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{totalLate}</div>
              <p className="text-sm text-muted-foreground mt-2">Late arrivals</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Days Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totalAbsent}</div>
              <p className="text-sm text-muted-foreground mt-2">Unexcused absences</p>
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
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="p-4 font-medium">{row.employee}</td>
                      <td className="p-4">{row.department}</td>
                      <td className="p-4">{row.daysPresent}</td>
                      <td className="p-4">{row.daysLate}</td>
                      <td className="p-4">{row.daysAbsent}</td>
                      <td className="p-4">{row.hours}</td>
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
