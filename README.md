# BackPocket — Billing & Financial Management

Custom billing and financial-management application for **Francis Financial & Business Consultancy Service**. Customer management, project tracking, invoicing, MMG payment processing, bank reconciliation, and full audit logging.

## Stack

- **Backend:** ASP.NET Core 8 (Web API), Entity Framework Core, PostgreSQL (Supabase-managed or self-hosted)
- **Frontend:** React 18 + TypeScript + Vite, Material UI 9, TanStack Query, React Router
- **Auth:** JWT (access + refresh tokens), BCrypt password hashing
- **RBAC:** Admin, Supervisor, Manager, Clerk, Viewer roles

## Architecture

```
backend/
├── BillingSystem.Api          # Controllers, DTOs, middleware, JWT
├── BillingSystem.Core         # Entities, enums, domain interfaces
└── BillingSystem.Infrastructure # EF Core DbContext, repos, MMG client

frontend/
├── src/api          # API client (axios) + React Query hooks
├── src/pages        # Route-level pages (Customers, Invoices, Payments, Audit, Dashboard)
├── src/components   # Reusable UI
└── src/layouts      # App shell with sidebar + topbar
```

## Modules

### Core Platform (Module 01)
1. **Customer Management** — CRUD, search, soft-delete, customer detail page with KPIs and project/invoice tabs
2. **Project Management** — Track work delivered to customers
   - Status workflow (Draft → Active → On Hold → Completed → Cancelled)
   - Milestones (with completion tracking)
   - Team assignments (Owner / Lead / Member / Reviewer)
   - Project templates (reusable structures with default milestones + invoice items)
   - Generate invoice directly from project (with template-driven defaults)
3. **Invoices** — Generate (line items, tax, discount), track status (Draft/Sent/Paid/Overdue/Cancelled), optional project linkage
4. **User Management** — Admin-only: invite users, edit role/status, reset password, deactivate

### Payment Reconciliation (Module 02)
5. **Payments**
   - **MMG API** — Initiate transaction, webhook receiver for confirmation
   - **Bank CSV Upload** — Parse statement, auto-match against invoice references
   - **Manual reconciliation** — Override / fix mismatches

### Cross-cutting
6. **Audit Log** — Every mutation (Create/Update/Delete) recorded with actor, timestamp, before/after snapshot
7. **Dashboard** — KPIs (outstanding, collected this month, overdue), charts

## Generating the new EF migration

After pulling the Project + Template + User additions, generate and apply the migration:

```bash
cd backend/src/BillingSystem.Api
dotnet ef migrations add AddProjectsAndTemplates \
  --project ../BillingSystem.Infrastructure \
  --startup-project .
dotnet ef database update \
  --project ../BillingSystem.Infrastructure \
  --startup-project .
```

## Getting Started

```bash
# Backend
cd backend/src/BillingSystem.Api
dotnet restore
dotnet ef database update
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```

See `docs/setup.md` for full instructions including PostgreSQL and MMG sandbox configuration.

For Supabase-specific setup (recommended for managed Postgres), see `docs/supabase.md`.

## RBAC system

The platform uses a permission-based authorization model:
- **Permissions** are atomic strings like `projects.assign` or `invoices.cancel` — defined in `BillingSystem.Core.Authorization.Permissions`. Each is enforced by a `[RequirePermission(...)]` attribute on the relevant endpoint.
- **Roles** are database rows with a name and a set of permissions. Five built-ins are seeded automatically: `Admin`, `Manager`, `Supervisor`, `Clerk`, `Viewer`.
- **Custom roles** can be created through the Access Roles page in the admin UI.
- **The Admin role** is locked and always holds every permission — this is the lockout safety net.
- Permission changes take effect on the user's next login. When an admin changes a user's role, that user's refresh token is invalidated automatically so they pick up the new permission set within ~15 minutes (the access token TTL).

See `docs/admin-seeding.md` for credential setup and `frontend/src/utils/permissions.ts` for how the frontend consumes the permission claims.
