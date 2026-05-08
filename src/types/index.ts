export type UserRole = 'Admin' | 'Manager' | 'Supervisor' | 'Clerk' | 'Viewer';

export type InvoiceStatus = 'Draft' | 'Sent' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';

export type PaymentMethod = 'Mmg' | 'BankTransfer' | 'Cash' | 'Cheque' | 'Other';

export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded' | 'Cancelled';

export type ProjectStatus = 'Draft' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;        // legacy enum, used as fallback
  roleName: string;      // current role's display name (matches enum for built-ins, custom for new roles)
  permissions: string[]; // flat list of permission keys; drives the dynamic `can` helper
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email?: string;
  phone?: string;
  mmgWalletId?: string;
  address?: string;
  taxId?: string;
  idNumber?: string;
  passportNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  reference?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentDate: string;
  mmgTransactionId?: string;
  mmgReference?: string;
  bankReference?: string;
  isReconciled: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
}

export interface DashboardKpis {
  totalOutstanding: number;
  collectedThisMonth: number;
  overdueAmount: number;
  activeCustomers: number;
  overdueInvoices: number;
  invoicesThisMonth: number;
  last12Months: { month: string; invoiced: number; collected: number }[];
  invoicesByStatus: { status: InvoiceStatus; count: number; amount: number }[];
}

// ---------- Projects ----------
export interface ProjectListItem {
  id: string;
  projectNumber: string;
  name: string;
  primaryCustomerId?: string;
  primaryCustomerName?: string;
  ownerCount: number;
  status: ProjectStatus;
  // Workflow holder — the user the project is currently "with". Null when
  // unassigned. Surfaced by ProjectListItemDto on the backend; pages render
  // the name with a fallback for the unassigned case.
  currentHolderUserId?: string;
  currentHolderUserName?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency: string;
  milestonesTotal: number;
  milestonesCompleted: number;
  invoicedTotal: number;
  paidTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  sortOrder: number;
}

export interface ProjectAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  assignedAt: string;
}

export interface ProjectCustomer {
  customerId: string;
  customerCode: string;
  customerName: string;
  isPrimary: boolean;
  addedAt: string;
}

export interface ProjectStatusEvent {
  id: string;
  occurredAt: string;
  fromStatus: ProjectStatus;
  toStatus: ProjectStatus;
  // Holder before this event. Null on the very first event (project creation).
  fromUserId?: string;
  fromUserName?: string;
  // Holder after this event. Null when the project becomes unassigned.
  toUserId?: string;
  toUserName?: string;
  // Whoever performed the action (always set — backend requires an authed user).
  actorUserId: string;
  actorUserName: string;
  comment?: string;
}

export interface ProjectDetail {
  id: string;
  projectNumber: string;
  name: string;
  description?: string;
  customers: ProjectCustomer[];
  templateId?: string;
  templateName?: string;
  status: ProjectStatus;
  // Workflow holder — see note on ProjectListItem above. Same fields appear
  // on the detail DTO so the handoff modal can prefill the "current owner".
  currentHolderUserId?: string;
  currentHolderUserName?: string;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  budget?: number;
  currency: string;
  notes?: string;
  // Comma-separated, matching the backend's `string? Tags` column. Pages
  // split on ',' before rendering chips.
  tags?: string;
  milestones: ProjectMilestone[];
  assignments: ProjectAssignment[];
  // Audit trail of every status change and handoff. Ordered oldest-first
  // by the backend; UI may reverse for display.
  statusHistory: ProjectStatusEvent[];
  invoiceCount: number;
  invoicedTotal: number;
  paidTotal: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Templates ----------
export interface TemplateMilestone {
  id?: string;
  title: string;
  description?: string;
  offsetDays?: number;
  sortOrder: number;
}

export interface TemplateItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  defaultBudget?: number;
  defaultDurationDays?: number;
  defaultTaxRate: number;
  milestones: TemplateMilestone[];
  invoiceItems: TemplateItem[];
  createdAt: string;
}

// ---------- Users ----------
export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;             // legacy enum, used for grouping/filtering
  roleId?: string;            // FK to actual Role row (preferred when set)
  roleName?: string;          // current role's display name
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// ---------- Roles (RBAC) ----------
export interface PermissionDescriptor {
  key: string;          // e.g. 'projects.assign'
  group: string;        // 'Projects'
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isBuiltIn: boolean;
  isSystemAdmin: boolean;
  permissions: string[];
  activeUserCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Customer summary ----------
export interface CustomerSummary {
  customer: Customer;
  projects: Array<{
    id: string;
    projectNumber: string;
    name: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
    budget?: number;
    currency: string;
    isPrimary: boolean;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    total: number;
    amountPaid: number;
    balance: number;
    currency: string;
    status: InvoiceStatus;
    projectId?: string;
  }>;
  kpis: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    projectCount: number;
    invoiceCount: number;
  };
}
