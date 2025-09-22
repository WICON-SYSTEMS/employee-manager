import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertEmployeeSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    adminId: string;
  }
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Admin Authentication Routes
  app.post('/api/v1/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.adminId = admin.id;
      const { password: _, ...adminWithoutPassword } = admin;
      res.json({ admin: adminWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/v1/admin/auth/me', requireAuth, async (req, res) => {
    try {
      const adminId = req.session.adminId;
      if (!adminId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const admin = await storage.getAdmin(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const { password: _, ...adminWithoutPassword } = admin;
      res.json({ admin: adminWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/v1/admin/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Employee Management Routes
  app.get('/api/v1/admin/employees', requireAuth, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json({ employees });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/v1/admin/employees', requireAuth, upload.single('photo'), async (req, res) => {
    try {
      const employeeData = {
        ...req.body,
        salary: parseInt(req.body.salary)
      };

      const validatedData = insertEmployeeSchema.parse(employeeData);

      // Check for duplicate email
      const existingEmployee = await storage.getEmployeeByEmail(validatedData.email);
      if (existingEmployee) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Handle photo upload
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        const newFilename = `${req.file.filename}${fileExtension}`;
        const newPath = path.join(uploadDir, newFilename);
        
        fs.renameSync(req.file.path, newPath);
        validatedData.photo = `/uploads/${newFilename}`;
      }

      const employee = await storage.createEmployee(validatedData);
      res.status(201).json({ employee });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/v1/admin/employees/:employee_id', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.employee_id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      res.json({ employee });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/v1/admin/employees/:employee_id', requireAuth, upload.single('photo'), async (req, res) => {
    try {
      const employeeId = req.params.employee_id;
      const existingEmployee = await storage.getEmployee(employeeId);
      
      if (!existingEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employeeData = {
        ...req.body,
        salary: req.body.salary ? parseInt(req.body.salary) : existingEmployee.salary
      };

      // Only validate fields that are being updated
      const updateData: Partial<typeof employeeData> = {};
      Object.keys(employeeData).forEach(key => {
        if (employeeData[key] !== undefined && employeeData[key] !== '') {
          updateData[key] = employeeData[key];
        }
      });

      // Check for duplicate email (excluding current employee)
      if (updateData.email && updateData.email !== existingEmployee.email) {
        const existingEmployeeWithEmail = await storage.getEmployeeByEmail(updateData.email);
        if (existingEmployeeWithEmail) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      // Handle photo upload
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        const newFilename = `${req.file.filename}${fileExtension}`;
        const newPath = path.join(uploadDir, newFilename);
        
        fs.renameSync(req.file.path, newPath);
        updateData.photo = `/uploads/${newFilename}`;

        // Delete old photo if it exists
        if (existingEmployee.photo && existingEmployee.photo.startsWith('/uploads/')) {
          const oldPhotoPath = path.join(process.cwd(), existingEmployee.photo);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
      }

      const updatedEmployee = await storage.updateEmployee(employeeId, updateData);
      res.json({ employee: updatedEmployee });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/v1/admin/employees/:employee_id', requireAuth, async (req, res) => {
    try {
      const employeeId = req.params.employee_id;
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Delete photo file if it exists
      if (employee.photo && employee.photo.startsWith('/uploads/')) {
        const photoPath = path.join(process.cwd(), employee.photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      const deleted = await storage.deleteEmployee(employeeId);
      if (deleted) {
        res.json({ message: 'Employee deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete employee' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin profile update
  app.put('/api/v1/admin/profile', requireAuth, async (req, res) => {
    try {
      const adminId = req.session.adminId;
      if (!adminId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { name, email, phone, currentPassword, newPassword } = req.body;

      const admin = await storage.getAdmin(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;

      // Handle password change
      if (newPassword) {
        if (!currentPassword || admin.password !== currentPassword) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        updateData.password = newPassword;
      }

      const updatedAdmin = await storage.updateAdmin(adminId, updateData);
      if (updatedAdmin) {
        const { password: _, ...adminWithoutPassword } = updatedAdmin;
        res.json({ admin: adminWithoutPassword });
      } else {
        res.status(500).json({ message: 'Failed to update profile' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Health check for mobile
  app.get('/api/v1/mobile/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
