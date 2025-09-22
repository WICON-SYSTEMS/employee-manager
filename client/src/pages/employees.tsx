import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeModal } from "@/components/employees/employee-modal";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/hooks/use-employees";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function Employees() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { 
    employees, 
    isLoading, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee,
    isCreating,
    isUpdating,
    createError,
    updateError
  } = useEmployees();
  const { toast } = useToast();

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      deleteEmployee(employee.id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Employee deleted successfully!",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to delete employee",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSubmitEmployee = (formData: FormData) => {
    if (editingEmployee) {
      updateEmployee({ id: editingEmployee.id, formData }, {
        onSuccess: () => {
          setShowModal(false);
          toast({
            title: "Success",
            description: "Employee updated successfully!",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update employee",
            variant: "destructive",
          });
        }
      });
    } else {
      createEmployee(formData, {
        onSuccess: () => {
          setShowModal(false);
          toast({
            title: "Success",
            description: "Employee added successfully!",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to create employee",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEditFromDetail = (employee: Employee) => {
    setShowDetailModal(false);
    handleEditEmployee(employee);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground mt-2">Manage your company's workforce</p>
          </div>
          <Button onClick={handleAddEmployee} data-testid="button-add-employee">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Employee Table */}
        <EmployeeTable
          employees={employees}
          onView={handleViewEmployee}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
          isLoading={isLoading}
        />

        {/* Employee Modal */}
        <EmployeeModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitEmployee}
          employee={editingEmployee}
          isLoading={isCreating || isUpdating}
        />

        {/* Employee Detail Modal */}
        <EmployeeDetailModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEditFromDetail}
          employee={selectedEmployee}
        />
      </div>
    </DashboardLayout>
  );
}
