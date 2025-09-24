import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useEmployees } from "@/hooks/use-employees";
import { Users, UserCheck, Clock, Calendar, RefreshCcw } from "lucide-react";
import { getAttendanceTrends, getAllAttendance, type AttendanceRecord } from "@/lib/attendance";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { employees, isLoading, error } = useEmployees();

  // Real data state
  const [weeklyAttendance, setWeeklyAttendance] = useState<Array<{ day: string; percentage: number; title: string }>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{ message: string; detail: string; time: string; color: string }>>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const weeklyHasData = weeklyAttendance.some(d => d.percentage > 0);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate stats from real employees list
  const employeeList = Array.isArray(employees) ? employees : [];
  const totalEmployees = employeeList.length;
  const activeEmployees = employeeList.filter(emp => emp.status === 'active').length;
  // Attendance is still mock-calculated based on active employees until real attendance API is available
  const presentToday = Math.floor(activeEmployees * 0.85); // 85% attendance rate
  const lateArrivals = Math.floor(activeEmployees * 0.08); // 8% late
  const absentToday = Math.max(activeEmployees - presentToday, 0);

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees.toString(),
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Active Employees",
      value: activeEmployees.toString(),
      icon: UserCheck,
      color: "bg-green-500"
    },
    {
      title: "Present Today",
      value: presentToday.toString(),
      icon: UserCheck,
      change: "85.2%",
      changeText: "attendance rate",
      positive: true,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Late Arrivals",
      value: lateArrivals.toString(),
      icon: Clock,
      change: "+3",
      changeText: "from yesterday",
      positive: false,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Absent Today",
      value: absentToday.toString(),
      icon: Calendar,
      change: "Absent employees",
      changeText: "",
      positive: null,
      color: "bg-red-100 text-red-600"
    }
  ];

  // Load real weekly attendance (derive last 7 non-empty days from last 30 days)
  useEffect(() => {
    const loadTrends = async () => {
      try {
        setLoadingTrends(true);
        const trends = await getAttendanceTrends(30);
        const all = trends.daily_trends || [];
        const withData = all.filter(d => (d.total_employees ?? 0) > 0 || (d.present ?? 0) > 0);
        const picked = (withData.length >= 7 ? withData.slice(-7) : all.slice(-7));
        const days = picked.map(d => {
          const date = new Date(d.date);
          const label = date.toLocaleDateString(undefined, { weekday: 'short' });
          const pct = d.total_employees > 0 ? Math.round((d.present / d.total_employees) * 100) : 0;
          const title = `${date.toLocaleDateString()} • Present ${d.present}/${d.total_employees} (${pct}%)`;
          return { day: label, percentage: pct, title };
        });
        setWeeklyAttendance(days);
        setLastUpdated(new Date().toLocaleString());
      } catch (e) {
        // swallow errors on dashboard load
      } finally {
        setLoadingTrends(false);
      }
    };
    loadTrends();
  }, []);

  // Load recent activities (latest attendance records)
  useEffect(() => {
    const loadRecent = async () => {
      try {
        setLoadingRecent(true);
        const resp = await getAllAttendance({ page: 1, limit: 8 });
        const items = (resp.attendance_records || []).map((r: AttendanceRecord) => {
          const name = (r as any).employee_name || r.employee_id;
          const time = r.check_in_time || r.created_at;
          const timeText = new Date(time).toLocaleTimeString();
          const message = r.status === 'checked_out' ? 'Checked out' : 'Checked in';
          const color = r.status === 'checked_out' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600';
          const detail = `${name} on ${new Date(r.date).toLocaleDateString()}`;
          return { message, detail, time: timeText, color };
        });
        setRecentActivities(items);
        setLastUpdated(new Date().toLocaleString());
      } catch (e) {
        // swallow errors on dashboard load
      } finally {
        setLoadingRecent(false);
      }
    };
    loadRecent();
  }, []);

  const handleRefresh = async () => {
    setLoadingTrends(true);
    setLoadingRecent(true);
    // trigger both loaders concurrently
    await Promise.all([
      (async () => {
        const trends = await getAttendanceTrends(30);
        const all = trends.daily_trends || [];
        const withData = all.filter(d => (d.total_employees ?? 0) > 0 || (d.present ?? 0) > 0);
        const picked = (withData.length >= 7 ? withData.slice(-7) : all.slice(-7));
        const days = picked.map(d => {
          const date = new Date(d.date);
          const label = date.toLocaleDateString(undefined, { weekday: 'short' });
          const pct = d.total_employees > 0 ? Math.round((d.present / d.total_employees) * 100) : 0;
          const title = `${date.toLocaleDateString()} • Present ${d.present}/${d.total_employees} (${pct}%)`;
          return { day: label, percentage: pct, title };
        });
        setWeeklyAttendance(days);
      })(),
      (async () => {
        const resp = await getAllAttendance({ page: 1, limit: 8 });
        const items = (resp.attendance_records || []).map((r: AttendanceRecord) => {
          const name = (r as any).employee_name || r.employee_id;
          const time = r.check_in_time || r.created_at;
          const timeText = new Date(time).toLocaleTimeString();
          const message = r.status === 'checked_out' ? 'Checked out' : 'Checked in';
          const color = r.status === 'checked_out' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600';
          const detail = `${name} on ${new Date(r.date).toLocaleDateString()}`;
          return { message, detail, time: timeText, color };
        });
        setRecentActivities(items);
      })()
    ]);
    setLoadingTrends(false);
    setLoadingRecent(false);
    setLastUpdated(new Date().toLocaleString());
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.full_name || 'Admin'}!
          </h1>
          <p className="text-muted-foreground mt-2">Today is {dateString}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${
                      stat.positive === true ? 'text-green-600' :
                      stat.positive === false ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {stat.change}
                    </span>
                    {stat.changeText && (
                      <span className="text-muted-foreground ml-1">{stat.changeText}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Attendance Chart */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Weekly Attendance</h3>
                <div className="flex items-center gap-3">
                  {lastUpdated && (
                    <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
                  )}
                  <button onClick={handleRefresh} className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-accent" disabled={loadingTrends || loadingRecent}>
                    <RefreshCcw className={"w-4 h-4" + ((loadingTrends || loadingRecent) ? " animate-spin" : "")} /> Refresh
                  </button>
                </div>
              </div>
              <div className="h-64">
                {weeklyAttendance.length > 0 && weeklyHasData ? (
                  <ResponsiveContainer>
                    <BarChart data={weeklyAttendance} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: number, _n, p: any) => [`${v}%`, p && p.payload && p.payload.title ? p.payload.title : '']} />
                      <Legend />
                      <Bar dataKey="percentage" name="Attendance %" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                    {loadingTrends ? 'Loading trends...' : 'No attendance recorded in the recent period.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {(recentActivities.length ? recentActivities : []).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3" data-testid={`activity-${index}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                      <div className="w-3 h-3 rounded-full bg-current" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activities.</p>
                )}
                {loadingRecent && (
                  <p className="text-sm text-muted-foreground">Loading recent activities...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
