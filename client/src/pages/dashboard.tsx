import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useEmployees } from "@/hooks/use-employees";
import { Users, UserCheck, Clock, Calendar } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { employees, isLoading, error } = useEmployees();

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

  // Mock weekly attendance data
  const weeklyAttendance = [
    { day: "Mon", percentage: 80 },
    { day: "Tue", percentage: 95 },
    { day: "Wed", percentage: 75 },
    { day: "Thu", percentage: 85 },
    { day: "Fri", percentage: 77 },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      type: "employee_added",
      message: "New employee added",
      detail: "Sarah Johnson joined Marketing",
      time: "2h ago",
      icon: "fas fa-user-plus",
      color: "bg-green-100 text-green-600"
    },
    {
      type: "attendance",
      message: "Attendance recorded",
      detail: "Mike Chen checked in at 9:15 AM",
      time: "5h ago",
      icon: "fas fa-clock",
      color: "bg-blue-100 text-blue-600"
    },
    {
      type: "late_arrival",
      message: "Late arrival",
      detail: "Alex Smith arrived 30 mins late",
      time: "1d ago",
      icon: "fas fa-exclamation-triangle",
      color: "bg-yellow-100 text-yellow-600"
    }
  ];

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
              <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Attendance</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {weeklyAttendance.map((day, index) => (
                  <div key={day.day} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-primary rounded-t transition-all duration-500"
                      style={{ height: `${day.percentage}%` }}
                      data-testid={`chart-bar-${day.day.toLowerCase()}`}
                    />
                    <span className="text-xs text-muted-foreground mt-2">
                      {day.day}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
