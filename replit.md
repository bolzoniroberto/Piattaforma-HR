# Overview

This is a corporate MBO (Management by Objectives) system for managing employee objectives, performance tracking, and document acceptance. The application provides both employee and administrative interfaces for objective management, progress tracking, and document workflows.

The system uses a modern full-stack architecture with React frontend, Express backend, and PostgreSQL database via Neon serverless.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (Latest Session)

## Test Data Seeding Feature
- **POST /api/seed**: Admin-only endpoint for populating comprehensive test data
  - Creates 3 indicator clusters (Gruppo, Performance/Direzione, ESG)
  - Creates 3+ calculation types (Lineare Crescente, Target Secco, Lineare Decrescente, etc.)
  - Creates 4+ business functions with hierarchical structure (primoLivello/secondoLivello)
  - Creates sample objectives dictionary entries linked to clusters and calculation types
  - Creates demo users with various roles and departments
  
- **AdminSettingsPage.tsx**: Added "Popola Dati Test" button
  - Calls /api/seed endpoint
  - Shows success/error toast with counts of created entities
  - Invalidates all relevant queries after seeding

## Assignment Workflow Fixes
- Fixed 500 error in POST /api/assignments and /api/assignments/bulk
- Assignment endpoints now fetch indicatorClusterId from objectives_dictionary before creating objective instance
- Ensures clusterId (NOT NULL constraint) is always populated correctly

## User Management Enhancement
- **AdminUsersPage.tsx**: Department field now uses Select component
  - Options populated from /api/business-functions
  - Displays as "primoLivello › secondoLivello" format
  - Complete CRUD functionality preserved

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system based on Carbon Design with Fluent influences
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation

**Design System**:
- Typography: Inter font family for UI, IBM Plex Mono for metrics/data
- Professional, enterprise-focused aesthetic with clear visual hierarchy
- Custom color system supporting light/dark modes via CSS variables
- Component library includes cards, badges, progress bars, dialogs, and data tables

**Key Pages**:
- Employee Dashboard: Personal objective view with progress tracking
- Admin Dashboard: Overview of all employees and objectives
- Admin Objectives: Management interface for creating/editing objectives
- Admin Users: Complete user management with CRUD operations (NEW)
- Regulation Page: Document viewing and acceptance workflow

## Backend Architecture

**Framework**: Express.js with TypeScript
- **Build System**: Vite for development, esbuild for production bundling
- **Module System**: ESM (ES Modules)
- **Development**: Hot module replacement via Vite middleware
- **Production**: Static file serving with SPA fallback

**API Structure**:
- RESTful endpoints under `/api` prefix
- Authentication middleware protecting routes
- Role-based access control (employee vs admin)
- Standardized error handling with Zod validation

**Authentication Strategy**:
- Replit OpenID Connect (OIDC) integration via Passport.js
- Session-based authentication with PostgreSQL session store
- Token refresh mechanism for long-lived sessions
- Role-based authorization middleware (isAuthenticated, isAdmin)

## Data Architecture

**ORM**: Drizzle ORM with type-safe schema definitions
- Schema-first approach with automatic TypeScript types
- Zod schema integration for runtime validation
- Migration support via drizzle-kit

**Database Schema**:

**Core Entities**:
- **users**: Employee data including role, department, salary (RAL), MBO percentage
- **indicatorClusters**: High-level objective categories (Strategic, Operational, Development)
- **calculationTypes**: Formulas for scoring objectives (Linear, Target-based, Inverse)
- **objectivesDictionary**: Reusable objective templates
- **objectiveClusters**: Groupings of related objectives
- **objectives**: Individual objective instances with progress tracking
- **objectiveAssignments**: Many-to-many relationship between users and objectives
- **documents**: Company documents (regulations, policies, contracts)
- **documentAcceptances**: User acceptance tracking for documents
- **sessions**: PostgreSQL-backed session storage for authentication

**Key Relationships**:
- Users can have multiple objective assignments
- Objectives belong to clusters and reference calculation types
- Documents track acceptance status per user
- Hierarchical structure: Indicator Clusters → Objective Clusters → Objectives

## External Dependencies

**Database**:
- Neon Serverless PostgreSQL (via @neondatabase/serverless)
- WebSocket-based connection pooling
- Environment variable: DATABASE_URL

**Authentication**:
- Replit OIDC provider
- Environment variables: ISSUER_URL, REPL_ID, SESSION_SECRET
- OpenID client library for token management

**Session Management**:
- connect-pg-simple for PostgreSQL session store
- 7-day session TTL with secure cookies

**UI Components**:
- Radix UI primitives (@radix-ui/* packages)
- shadcn/ui component patterns
- Lucide React for icons

**Development Tools**:
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal)
- TypeScript with strict mode
- Path aliases for clean imports (@/, @shared/, @assets/)

**Deployment**:
- Production build outputs to dist/ directory
- Client assets bundled to dist/public
- Server bundle as single ESM file
- Environment-specific entry points (index-dev.ts, index-prod.ts)
