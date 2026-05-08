// Permission keys — must match the backend's Permissions class character-for-character.
// When you add a permission on the backend, mirror it here.
export const PERMISSIONS = {
  CustomersView:       'customers.view',
  CustomersEdit:       'customers.edit',
  CustomersDeactivate: 'customers.deactivate',

  ProjectsView:         'projects.view',
  ProjectsCreate:       'projects.create',
  ProjectsEdit:         'projects.edit',
  ProjectsChangeStatus: 'projects.changeStatus',
  ProjectsAssign:       'projects.assign',
  ProjectsCancel:       'projects.cancel',

  InvoicesView:   'invoices.view',
  InvoicesEdit:   'invoices.edit',
  InvoicesCancel: 'invoices.cancel',
  PaymentsView:   'payments.view',
  PaymentsRecord: 'payments.record',

  TemplatesView:   'templates.view',
  TemplatesEdit:   'templates.edit',
  TemplatesDelete: 'templates.delete',
  AuditView:       'audit.view',
  UsersManage:     'users.manage',
  RolesManage:     'roles.manage',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
