import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuthStore } from '@/api/authStore';
import AppLayout from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CustomersPage from '@/pages/CustomersPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import InvoicesPage from '@/pages/InvoicesPage';
import InvoiceDetailPage from '@/pages/InvoiceDetailPage';
import PaymentsPage from '@/pages/PaymentsPage';
import AuditPage from '@/pages/AuditPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import TemplatesPage from '@/pages/TemplatesPage';
import UsersPage from '@/pages/UsersPage';
import AccessRolesPage from '@/pages/AccessRolesPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequirePermissionRoute({ permission, children }:
  { permission: string; children: ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.permissions?.includes(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="users" element={
            <RequirePermissionRoute permission="users.manage">
              <UsersPage />
            </RequirePermissionRoute>
          } />
          <Route path="access" element={
            <RequirePermissionRoute permission="roles.manage">
              <AccessRolesPage />
            </RequirePermissionRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
