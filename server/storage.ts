import { type Admin, type InsertAdmin, type Employee, type InsertEmployee } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Admin methods
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: string, admin: Partial<InsertAdmin>): Promise<Admin | undefined>;

  // Employee methods
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private employees: Map<string, Employee>;

  constructor() {
    this.admins = new Map();
    this.employees = new Map();
    
    // Initialize with default admin
    const defaultAdmin: Admin = {
      id: randomUUID(),
      name: "John Doe",
      email: "admin@company.com",
      password: "admin123",
      phone: "+1 (555) 123-4567"
    };
    this.admins.set(defaultAdmin.id, defaultAdmin);
  }

  // Admin methods
  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.email === email,
    );
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const admin: Admin = { 
      ...insertAdmin, 
      id,
      phone: insertAdmin.phone || null
    };
    this.admins.set(id, admin);
    return admin;
  }

  async updateAdmin(id: string, updates: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;
    
    const updatedAdmin = { ...admin, ...updates };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.email === email,
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.generateEmployeeId();
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      photo: insertEmployee.photo || null,
      createdAt: new Date()
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  private generateEmployeeId(): string {
    const existingIds = Array.from(this.employees.keys())
      .filter(id => id.startsWith('EMP'))
      .map(id => parseInt(id.replace('EMP', '')))
      .filter(num => !isNaN(num));
    
    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `EMP${String(maxNum + 1).padStart(3, '0')}`;
  }
}

export const storage = new MemStorage();
