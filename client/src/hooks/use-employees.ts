import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, InsertEmployee } from "@shared/schema";

interface EmployeesResponse {
  employees: Employee[];
}

interface EmployeeResponse {
  employee: Employee;
}

export function useEmployees() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/v1/admin/employees"],
    queryFn: async (): Promise<EmployeesResponse> => {
      const response = await apiRequest("GET", "/api/v1/admin/employees");
      return response.json();
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<EmployeeResponse> => {
      const response = await fetch("/api/v1/admin/employees", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create employee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/employees"] });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }): Promise<EmployeeResponse> => {
      const response = await fetch(`/api/v1/admin/employees/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update employee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/employees"] });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiRequest("DELETE", `/api/v1/admin/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/employees"] });
    },
  });

  return {
    employees: data?.employees || [],
    isLoading,
    error,
    createEmployee: createEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDeleting: deleteEmployeeMutation.isPending,
    createError: createEmployeeMutation.error,
    updateError: updateEmployeeMutation.error,
    deleteError: deleteEmployeeMutation.error,
  };
}
