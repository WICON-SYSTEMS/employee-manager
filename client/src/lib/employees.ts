import { apiCall, apiRequest } from "./queryClient";
import type { Employee, InsertEmployee, UpdateEmployee, BiometricUploadResponse } from "@shared/schema";

// Get all employees - TEMPORARY: Endpoint not available yet
export async function getEmployees(): Promise<Employee[]> {
  // TODO: Replace with actual API call when /v1/admin/employees endpoint is available
  console.log('Employees list endpoint not available yet - returning empty array');
  return [];
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
