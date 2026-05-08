import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AuditLog, AuthResponse, Customer, CustomerSummary, DashboardKpis, Invoice,
  PagedResult, Payment, PermissionDescriptor, ProjectAssignment, ProjectDetail,
  ProjectListItem, ProjectMilestone, ProjectStatus, ProjectTemplate, Role, UserListItem,
} from '@/types';

// ---------------- Auth ----------------
export const useLogin = () =>
  useMutation({
    mutationFn: async (vars: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', vars);
      return data;
    },
  });

// ---------------- Customers ----------------
export const useCustomers = (params: { search?: string; page: number; pageSize: number }) =>
  useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const { data } = await api.get<PagedResult<Customer>>('/customers', { params });
      return data;
    },
  });

export const useCustomer = (id: string | undefined) =>
  useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get<Customer>(`/customers/${id}`)).data,
    enabled: !!id,
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Customer>) => (await api.post<Customer>('/customers', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Customer> & { id: string }) =>
      (await api.put<Customer>(`/customers/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

// ---------------- Invoices ----------------
export const useInvoices = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => (await api.get<PagedResult<Invoice>>('/invoices', { params })).data,
  });

export const useInvoice = (id: string | undefined) =>
  useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get<Invoice>(`/invoices/${id}`)).data,
    enabled: !!id,
  });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.post<Invoice>('/invoices', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useUpdateInvoiceStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch<Invoice>(`/invoices/${id}/status`, { status })).data,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', v.id] });
    },
  });
};

// ---------------- Payments ----------------
export const usePayments = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ['payments', params],
    queryFn: async () => (await api.get<PagedResult<Payment>>('/payments', { params })).data,
  });

export const useInitiateMmg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { invoiceId: string; customerWallet: string }) =>
      (await api.post<Payment>('/payments/mmg/initiate', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useRecordManualPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.post<Payment>('/payments/manual', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useUploadBankStatement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, bankName }: { file: File; bankName: string }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bankName', bankName);
      const { data } = await api.post('/payments/bank-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useReconcile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { paymentId: string; invoiceId?: string; notes?: string }) =>
      (await api.post<Payment>('/payments/reconcile', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

// ---------------- Audit ----------------
export const useAuditLogs = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ['audit', params],
    queryFn: async () => (await api.get<PagedResult<AuditLog>>('/audit', { params })).data,
  });

// ---------------- Dashboard ----------------
export const useDashboardKpis = () =>
  useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => (await api.get<DashboardKpis>('/dashboard/kpis')).data,
  });

// ---------------- Projects ----------------
export const useProjects = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ['projects', params],
    queryFn: async () => (await api.get<PagedResult<ProjectListItem>>('/projects', { params })).data,
  });

export const useProject = (id: string | undefined) =>
  useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<ProjectDetail>(`/projects/${id}`)).data,
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.post<ProjectDetail>('/projects', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      (await api.put<ProjectDetail>(`/projects/${id}`, body)).data,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', v.id] });
    },
  });
};

export const useUpdateProjectStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProjectStatus }) =>
      (await api.patch<ProjectDetail>(`/projects/${id}/status`, { status })).data,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', v.id] });
    },
  });
};

export const useCancelProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

// Milestones
export const useAddMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }: { projectId: string } & Record<string, unknown>) =>
      (await api.post<ProjectMilestone>(`/projects/${projectId}/milestones`, body)).data,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['project', v.projectId] }),
  });
};

export const useUpdateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId, ...body }:
      { projectId: string; milestoneId: string } & Record<string, unknown>) =>
      (await api.put<ProjectMilestone>(`/projects/${projectId}/milestones/${milestoneId}`, body)).data,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['project', v.projectId] }),
  });
};

export const useDeleteMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, milestoneId }: { projectId: string; milestoneId: string }) =>
      api.delete(`/projects/${projectId}/milestones/${milestoneId}`),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['project', v.projectId] }),
  });
};

// Assignments
export const useAssignMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, role }:
      { projectId: string; userId: string; role: string }) =>
      (await api.post<ProjectAssignment>(`/projects/${projectId}/assignments`, { userId, role })).data,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['project', v.projectId] }),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) =>
      api.delete(`/projects/${projectId}/assignments/${userId}`),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['project', v.projectId] }),
  });
};

// Workflow handoff: change status and/or transfer to another user with a comment
export const useHandoffProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }:
      { projectId: string; newStatus?: string; toUserId?: string | null; comment?: string }) =>
      (await api.post(`/projects/${projectId}/handoff`, body)).data,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', v.projectId] });
    },
  });
};

// Generate invoice from project
export const useGenerateProjectInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }: { projectId: string } & Record<string, unknown>) =>
      (await api.post(`/projects/${projectId}/invoices`, body)).data,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['project', v.projectId] });
    },
  });
};

// ---------------- Templates ----------------
export const useTemplates = (activeOnly = true) =>
  useQuery({
    queryKey: ['templates', activeOnly],
    queryFn: async () => (await api.get<ProjectTemplate[]>('/templates', { params: { activeOnly } })).data,
  });

export const useTemplate = (id: string | undefined) =>
  useQuery({
    queryKey: ['template', id],
    queryFn: async () => (await api.get<ProjectTemplate>(`/templates/${id}`)).data,
    enabled: !!id,
  });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.post<ProjectTemplate>('/templates', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      (await api.put<ProjectTemplate>(`/templates/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

// ---------------- Users (Admin) ----------------
export const useUsers = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: async () => (await api.get<UserListItem[]>('/users', { params })).data,
  });

export const useRegisterUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string; fullName: string; role: string }) =>
      (await api.post('/auth/register', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      (await api.put<UserListItem>(`/users/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useResetUserPassword = () =>
  useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.post(`/users/${id}/reset-password`, { newPassword }),
  });

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

// ---------------- Customer summary ----------------
export const useCustomerSummary = (id: string | undefined) =>
  useQuery({
    queryKey: ['customer-summary', id],
    queryFn: async () => (await api.get<CustomerSummary>(`/customers/${id}/summary`)).data,
    enabled: !!id,
  });

// ---------------- Project customer owners ----------------
export const useAddProjectCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, customerId, makePrimary }:
      { projectId: string; customerId: string; makePrimary?: boolean }) =>
      (await api.post(`/projects/${projectId}/customers`, { customerId, makePrimary: !!makePrimary })).data,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['project', v.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useSetPrimaryProjectCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, customerId }: { projectId: string; customerId: string }) =>
      api.patch(`/projects/${projectId}/customers/${customerId}/primary`),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['project', v.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useRemoveProjectCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, customerId }: { projectId: string; customerId: string }) =>
      api.delete(`/projects/${projectId}/customers/${customerId}`),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['project', v.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// ─── RBAC: roles + permission catalog ───────────────────────────────────

export const usePermissionCatalog = () =>
  useQuery({
    queryKey: ['permission-catalog'],
    queryFn: async () => (await api.get<PermissionDescriptor[]>('/roles/catalog')).data,
    staleTime: 30 * 60 * 1000,    // 30 minutes — catalog changes only on deploy
  });

export const useRoles = () =>
  useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<Role[]>('/roles')).data,
  });

export const useRole = (id: string | undefined) =>
  useQuery({
    queryKey: ['role', id],
    queryFn: async () => (await api.get<Role>(`/roles/${id}`)).data,
    enabled: !!id,
  });

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; permissions: string[] }) =>
      (await api.post<Role>('/roles', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }:
      { id: string; name?: string; description?: string; permissions: string[] }) =>
      (await api.put<Role>(`/roles/${id}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};
