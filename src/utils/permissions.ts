import type { UserRole, User } from '@/types';
import { PERMISSIONS, type PermissionKey } from './permission-keys';

// Permissions are now sourced from the logged-in user's `permissions[]` —
// which the backend computes from the user's role's permission grants
// (or from Permissions.All if the user is a system Admin).
//
// Each `can.X` helper takes the current user (or a permissions array) and
// returns whether they're allowed. Pages typically pass `user` from the
// auth store. The helpers are tolerant of `undefined` — they just return
// false, which hides the relevant button/menu.

type WhoArg = User | string[] | { permissions?: string[] } | undefined | null;

function permissionsOf(arg: WhoArg): string[] {
  if (!arg) return [];
  if (Array.isArray(arg)) return arg;
  return arg.permissions ?? [];
}

function has(arg: WhoArg, perm: PermissionKey): boolean {
  return permissionsOf(arg).includes(perm);
}

export const can = {
  // Customers
  viewCustomers:       (w: WhoArg) => has(w, PERMISSIONS.CustomersView),
  editCustomers:       (w: WhoArg) => has(w, PERMISSIONS.CustomersEdit),
  deactivateCustomers: (w: WhoArg) => has(w, PERMISSIONS.CustomersDeactivate),

  // Projects
  viewProjects:        (w: WhoArg) => has(w, PERMISSIONS.ProjectsView),
  createProjects:      (w: WhoArg) => has(w, PERMISSIONS.ProjectsCreate),
  editProjects:        (w: WhoArg) => has(w, PERMISSIONS.ProjectsEdit),
  changeProjectStatus: (w: WhoArg) => has(w, PERMISSIONS.ProjectsChangeStatus),
  assignProjects:      (w: WhoArg) => has(w, PERMISSIONS.ProjectsAssign),
  cancelProjects:      (w: WhoArg) => has(w, PERMISSIONS.ProjectsCancel),

  // Invoices & payments
  viewInvoices:    (w: WhoArg) => has(w, PERMISSIONS.InvoicesView),
  createInvoices:  (w: WhoArg) => has(w, PERMISSIONS.InvoicesEdit),
  cancelInvoices:  (w: WhoArg) => has(w, PERMISSIONS.InvoicesCancel),
  viewPayments:    (w: WhoArg) => has(w, PERMISSIONS.PaymentsView),
  recordPayments:  (w: WhoArg) => has(w, PERMISSIONS.PaymentsRecord),

  // Configuration
  viewTemplates:   (w: WhoArg) => has(w, PERMISSIONS.TemplatesView),
  manageTemplates: (w: WhoArg) => has(w, PERMISSIONS.TemplatesEdit),
  deleteTemplates: (w: WhoArg) => has(w, PERMISSIONS.TemplatesDelete),
  viewAudit:       (w: WhoArg) => has(w, PERMISSIONS.AuditView),
  manageUsers:     (w: WhoArg) => has(w, PERMISSIONS.UsersManage),
  manageRoles:     (w: WhoArg) => has(w, PERMISSIONS.RolesManage),

  // Generic check by key (handy for dynamic UIs)
  do: (w: WhoArg, perm: PermissionKey) => has(w, perm),
};

// ─── Role display helpers (kept for badge rendering, sidebar copy, etc.) ───
// The 5 built-in roles still have well-known names; custom roles use whatever
// name the Admin gave them.
export const ROLES_IN_ORDER: UserRole[] = ['Admin', 'Manager', 'Supervisor', 'Clerk', 'Viewer'];

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Admin:      'Full access including users, roles, and templates',
  Manager:    'Full project and invoicing power; cancellations',
  Supervisor: 'Assigns and reassigns projects; full invoicing power',
  Clerk:      'Customers, projects, invoices, payments — but cannot assign projects',
  Viewer:     'Read-only access',
};
