# Overview

This is a full-stack employee attendance management system built with React/TypeScript frontend and Express.js backend. The system provides an admin dashboard for managing employees, tracking attendance, and generating reports. It features a modern UI built with shadcn/ui components and uses PostgreSQL for data persistence via Drizzle ORM.

The application is designed as an admin portal for HR personnel to manage employee records, with plans for mobile app integration for employee check-ins using facial biometrics and QR codes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: Express sessions with in-memory storage (development) and PostgreSQL sessions (production)
- **File Uploads**: Multer middleware for handling employee photo uploads
- **API Design**: RESTful endpoints with consistent error handling and logging
- **Development Setup**: Hot reload with Vite integration for seamless full-stack development

## Authentication & Authorization
- **Admin Authentication**: Session-based authentication with secure login/logout
- **Route Protection**: Frontend route guards that redirect unauthenticated users to login
- **Session Security**: HTTP-only session cookies with configurable expiration
- **Default Credentials**: Seeded admin account (admin@company.com / admin123) for initial access

## Database Design
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Two main entities - Admins and Employees
- **Admin Table**: ID, name, email, password, phone
- **Employee Table**: ID, name, email, phone, position, department, salary, status, photo, timestamps
- **Validation**: Zod schemas for runtime type checking and form validation
- **Migrations**: Drizzle Kit for database schema management

## File Management
- **Upload Directory**: Local filesystem storage in `/uploads` directory
- **File Validation**: Image-only uploads with 5MB size limit
- **Static Serving**: Express static middleware serves uploaded files
- **Photo Handling**: Employee photos stored with unique filenames and served via HTTP endpoints

## Development Features
- **Full-Stack Development**: Unified development server with Vite middleware
- **Hot Reload**: Both frontend and backend support hot reloading
- **Error Handling**: Runtime error overlay in development
- **TypeScript**: End-to-end type safety from database to UI components
- **Path Aliases**: Organized imports with @ prefixes for clean code structure

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and data fetching
- **wouter**: Lightweight React router
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Zod integration for form validation

## UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives (accordion, dialog, dropdown, etc.)
- **shadcn/ui**: Pre-built component system based on Radix UI
- **lucide-react**: Modern icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling

## Database & Validation
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **drizzle-kit**: Database migration and introspection toolkit
- **@neondatabase/serverless**: PostgreSQL driver for Neon database
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

## Backend Dependencies
- **express**: Web application framework
- **express-session**: Session middleware for authentication
- **connect-pg-simple**: PostgreSQL session store
- **multer**: Multipart form data handling for file uploads
- **date-fns**: Date manipulation utilities

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **esbuild**: JavaScript bundler for production builds