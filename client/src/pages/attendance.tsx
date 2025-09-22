import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, RefreshCcw, Download } from "lucide-react";

// Temporary mock data until attendance API endpoints are available
const mockAttendance = [
  { id: "1", employee: "Alex Smith", status: "Present", checkIn: "09:05", checkOut: "17:35", hours: 8.5, date: "2025-09-22", department: "Engineering" },
  { id: "2", employee: "Jane Doe", status: "Late", checkIn: "09:35", checkOut: "17:45", hours: 8.0, date: "2025-09-22", department: "HR" },
  { id: "3", employee: "Michael Chen", status: "Absent", checkIn: "-", checkOut: "-", hours: 0, date: "2025-09-22", department: "Engineering" },
  { id: "4", employee: "Sarah Johnson", status: "Present", checkIn: "08:55", checkOut: "17:10", hours: 8.25, date: "2025-09-22", department: "Finance" },
];

export default function AttendancePage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<string>("all");

  const filtered = mockAttendance.filter((row) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || row.employee.toLowerCase().includes(q);
    const matchesDept = department === "all" || row.department === department;
    const matchesDate = !date || row.date === date;
    const matchesStatus = status === "all" || row.status.toLowerCase() === status;
    return matchesQuery && matchesDept && matchesDate && matchesStatus;
  });

  const presentCount = filtered.filter((r) => r.status === "Present").length;
  const lateCount = filtered.filter((r) => r.status === "Late").length;
  const absentCount = filtered.filter((r) => r.status === "Absent").length;

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
            <Button variant="outline" className="gap-2">
              <RefreshCcw className="w-4 h-4" /> Refresh
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
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Date</label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <Button variant="outline" size="icon">
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
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
            <CardTitle>Daily Attendance</CardTitle>
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
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="p-4 font-medium">{row.employee}</td>
                      <td className="p-4">{row.department}</td>
                      <td className="p-4">
                        <span
                          className={
                            row.status === "Present"
                              ? "px-2 py-1 rounded-full text-xs bg-green-100 text-green-700"
                              : row.status === "Late"
                              ? "px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700"
                              : "px-2 py-1 rounded-full text-xs bg-red-100 text-red-700"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4">{row.checkIn}</td>
                      <td className="p-4">{row.checkOut}</td>
                      <td className="p-4">{row.hours}</td>
                      <td className="p-4">{row.date}</td>
                    </tr>
                  ))}
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
