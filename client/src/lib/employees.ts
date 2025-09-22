import { apiCall, apiRequest } from "./queryClient";
import type { Employee, InsertEmployee, UpdateEmployee, BiometricUploadResponse } from "@shared/schema";

// Get all employees (paginated)
type EmployeesListResponse = {
  employees: Employee[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

export async function getEmployees(page = 1, limit = 50): Promise<Employee[]> {
  const result = await apiCall<EmployeesListResponse>(
    "GET",
    `/v1/admin/employees?page=${page}&limit=${limit}`
  );
  return result.employees;
}

// Get employee by ID
export async function getEmployee(employeeId: string): Promise<Employee> {
  const result = await apiCall<Employee>("GET", `/v1/admin/employees/${employeeId}`);
  return result;
}

// Create new employee
export async function createEmployee(employeeData: InsertEmployee): Promise<Employee> {
  const result = await apiCall<Employee>("POST", "/v1/admin/employees", employeeData);
  return result;
}

// Update employee
export async function updateEmployee(employeeId: string, employeeData: UpdateEmployee): Promise<Employee> {
  const result = await apiCall<Employee>("PUT", `/v1/admin/employees/${employeeId}`, employeeData);
  return result;
}

// Delete employee
export async function deleteEmployee(employeeId: string): Promise<void> {
  await apiCall<void>("DELETE", `/v1/admin/employees/${employeeId}`);
}

// Upload employee photo/biometrics
export async function uploadEmployeeBiometrics(employeeId: string, file: File): Promise<BiometricUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  
  const result = await apiCall<BiometricUploadResponse>(
    "POST", 
    `/v1/mobile/employees/${employeeId}/facial-biometrics/upload`, 
    formData, 
    true // isFormData
  );
  return result;
}
