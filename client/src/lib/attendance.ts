import { apiRequest } from "@/lib/queryClient";
import type { ApiResponse } from "@shared/schema";

export interface AttendanceRecord {
  attendance_id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  status: string;
  qr_code_scanned: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EmployeeAttendanceResponse {
  attendance_records: AttendanceRecord[];
  total_records: number;
  date_range: null | { start_date: string; end_date: string };
}

export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<EmployeeAttendanceResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const query = params.toString();
  const url = query
    ? `/v1/attendance/employee/${encodeURIComponent(employeeId)}?${query}`
    : `/v1/attendance/employee/${encodeURIComponent(employeeId)}`;

  const res = await apiRequest("GET", url);
  const json = (await res.json()) as ApiResponse<EmployeeAttendanceResponse>;
  if (json.status !== "success") {
    throw new Error(json.message || "Failed to fetch attendance");
  }
  return json.data;
}
