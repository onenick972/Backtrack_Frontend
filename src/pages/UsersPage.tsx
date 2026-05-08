import { useState, type FormEvent } from 'react';
import { Plus, Edit2, KeyRound, UserX, Mail, Shield } from 'lucide-react';
import {
  Box, Button, Card, Checkbox, FormControlLabel, IconButton, MenuItem, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, TextField, Typography, Alert,
  Divider,
} from '@mui/material';
import {
  useUsers, useRegisterUser, useUpdateUser, useResetUserPassword, useDeactivateUser, useRoles,
} from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell } from '@/components/ui/UI';
import { formatDate } from '@/utils/format';
import { useAuthStore } from '@/api/authStore';
import { ROLES_IN_ORDER, ROLE_DESCRIPTIONS } from '@/utils/permissions';
import type { UserListItem, UserRole } from '@/types';
import toast from 'react-hot-toast';
import { humanizeError } from '@/utils/errors';
import { useAppConfirm } from '@/utils/confirm';
import { colors } from '@/theme';

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const { data, isLoading } = useUsers({
    search: search || undefined,
    activeOnly: showInactive ? undefined : true,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [resetting, setResetting] = useState<UserListItem | null>(null);

  if (me?.role !== 'Admin') {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ color: 'text.disabled', mb: 1 }}>
          <Shield size={28} strokeWidth={1.5} />
        </Box>
        <Typography sx={{
          fontWeight: 500
        }}>Admin access required</Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 0.5
          }}>
          User management is restricted to administrators.
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      <PageHeader title="Users" eyebrow="Staff & Access"
        actions={
          <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        }
      >
        Manage internal staff accounts. Roles determine what each person can do — from full administration to read-only access.
      </PageHeader>
      <Card sx={{ mb: 2 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
          <TextField
            size="small" sx={{ flex: 1, minWidth: 240 }}
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
          <FormControlLabel
            control={<Checkbox checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />}
            label={<Typography variant="overline" sx={{
              color: "text.secondary"
            }}>Show inactive</Typography>}
          />
          {data && (
            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
              {data.length} total
            </Typography>
          )}
        </Stack>

        {isLoading ? (
          <Box sx={{
            p: 2
          }}><LoadingShell /></Box>
        ) : !data || data.length === 0 ? (
          <EmptyState title="No users found" description="Invite your first staff member to give them access to the system."
            action={
              <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setInviteOpen(true)}>
                Invite user
              </Button>
            } />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last login</TableCell>
                <TableCell>Created</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(u => (
                <TableRow key={u.id}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {u.fullName}
                    {u.id === me.id && (
                      <Box component="span" sx={{
                        ml: 1, display: 'inline-block', px: 1, py: 0.25,
                        fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        bgcolor: 'rgba(197,165,114,0.1)', color: colors.accent.dark,
                        border: '1px solid rgba(197,165,114,0.3)',
                      }}>You</Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        gap: 0.75
                      }}>
                      <Box sx={{ color: 'text.disabled' }}>
                        <Mail size={11} strokeWidth={1.5} />
                      </Box>
                      <Typography variant="body2">{u.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><RoleBadge role={u.role} roleName={u.roleName} /></TableCell>
                  <TableCell>
                    {u.isActive
                      ? <Box component="span" sx={{
                          display: 'inline-block', px: 1, py: 0.25,
                          fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          bgcolor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0',
                        }}>Active</Box>
                      : <Box component="span" sx={{
                          display: 'inline-block', px: 1, py: 0.25,
                          fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          bgcolor: colors.ink[100], color: colors.ink[500],
                          border: '1px solid', borderColor: colors.ink[200],
                        }}>Inactive</Box>}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "flex-end",
                        gap: 0.5
                      }}>
                      <IconButton size="small" title="Edit user" onClick={() => setEditing(u)}>
                        <Edit2 size={14} strokeWidth={1.5} />
                      </IconButton>
                      <IconButton size="small" title="Reset password" onClick={() => setResetting(u)}>
                        <KeyRound size={14} strokeWidth={1.5} />
                      </IconButton>
                      {u.id !== me.id && u.isActive && (
                        <IconButton size="small" title="Deactivate (use edit dialog)"
                                    sx={{ '&:hover': { color: colors.danger, bgcolor: '#fff1f2' } }}
                                    onClick={() => setEditing(u)}>
                          <UserX size={14} strokeWidth={1.5} />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />}
    </Box>
  );
}

function RoleBadge({ role, roleName }: { role: UserRole; roleName?: string }) {
  const builtInColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    Admin:      { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
    Manager:    { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
    Supervisor: { bg: '#f0f9ff', text: '#075985', border: '#bae6fd' },
    Clerk:      { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    Viewer:     { bg: colors.ink[100], text: colors.ink[700], border: colors.ink[200] },
  };
  const display = roleName ?? role;
  const isCustom = roleName && !ROLES_IN_ORDER.includes(roleName as UserRole);
  const palette = isCustom
    ? { bg: 'rgba(197,165,114,0.1)', text: colors.accent.dark, border: 'rgba(197,165,114,0.3)' }
    : (builtInColors[(roleName ?? role) as UserRole] ?? builtInColors[role]);
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: palette.bg, color: palette.text,
      border: '1px solid', borderColor: palette.border,
    }}>
      {display}
    </Box>
  );
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const register = useRegisterUser();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Clerk');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    try {
      await register.mutateAsync({ email, password, fullName, role });
      toast.success(`Invited ${fullName}. Share the temporary password securely.`);
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to invite user'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Invite user" error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Alert severity="info" variant="outlined">
            Set a temporary password and share it with the user securely (e.g. via password manager).
            Ask them to change it on first login.
          </Alert>
          <TextField label="Full name" required fullWidth value={fullName}
                     onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
          <TextField label="Email" type="email" required fullWidth value={email}
                     onChange={e => setEmail(e.target.value)} placeholder="jane@company.gy" />
          <TextField select label="Role" required fullWidth value={role}
                     onChange={e => setRole(e.target.value as UserRole)}>
            {ROLES_IN_ORDER.map(r => (
              <MenuItem key={r} value={r}>{r} — {ROLE_DESCRIPTIONS[r]}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Temporary password"
            required
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            slotProps={{
              input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
              htmlInput: { minLength: 8 }
            }} />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={register.isPending}>
              {register.isPending ? 'Inviting…' : 'Invite user'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function EditUserModal({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const update = useUpdateUser();
  const deactivate = useDeactivateUser();
  const { data: roles } = useRoles();
  const { user: me } = useAuthStore();
  const confirm = useAppConfirm();
  const [fullName, setFullName] = useState(user.fullName);
  const [roleId, setRoleId] = useState<string>(user.roleId ?? '');
  const [isActive, setIsActive] = useState(user.isActive);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const chosen = roles?.find(r => r.id === roleId);
      await update.mutateAsync({
        id: user.id,
        fullName,
        role: (chosen && ROLES_IN_ORDER.includes(chosen.name as UserRole))
          ? (chosen.name as UserRole)
          : user.role,
        roleId: roleId || undefined,
        isActive,
      });
      toast.success('User updated');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to update user'));
    }
  };

  const handleDeactivate = async () => {
    setFormError(null);
    if (user.id === me?.id) { setFormError("You can't deactivate yourself"); return; }
    if (!(await confirm({
      kind: 'danger',
      title: 'Deactivate user',
      message: `Deactivate ${user.fullName}? They will lose access immediately and any active sessions will be invalidated.`,
      confirmLabel: 'Deactivate',
    }))) return;
    try {
      await deactivate.mutateAsync(user.id);
      toast.success('User deactivated');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to deactivate'));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${user.fullName}`}
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Full name" required fullWidth value={fullName}
                     onChange={e => setFullName(e.target.value)} />
          <TextField label="Email" fullWidth value={user.email} disabled
                     helperText="Email cannot be changed" />
          <TextField select label="Role" required fullWidth value={roleId}
                     onChange={e => setRoleId(e.target.value)}
                     disabled={user.id === me?.id || !roles}
                     helperText={user.id === me?.id ? 'You cannot change your own role' : ' '}>
            {(roles ?? []).map(r => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}{r.isBuiltIn ? '' : ' (custom)'}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Checkbox checked={isActive} onChange={e => setIsActive(e.target.checked)}
                               disabled={user.id === me?.id} />}
            label="Active (can log in)"
          />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              gap: 1
            }}>
            {user.id !== me?.id && user.isActive ? (
              <Button variant="text" color="error" startIcon={<UserX size={13} />} onClick={handleDeactivate}>
                Deactivate
              </Button>
            ) : <span />}
            <Stack direction="row" sx={{
              gap: 1
            }}>
              <Button variant="outlined" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={update.isPending}>Save changes</Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const reset = useResetUserPassword();
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (newPassword.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    try {
      await reset.mutateAsync({ id: user.id, newPassword });
      toast.success('Password reset. Share it with the user securely.');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to reset password'));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Reset password for ${user.fullName}`}
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined">
            The user's existing session will be invalidated. They must log in with the new password.
          </Alert>
          <TextField
            label="New password"
            required
            fullWidth
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            slotProps={{
              input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
              htmlInput: { minLength: 8 }
            }} />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={reset.isPending}>
              {reset.isPending ? 'Resetting…' : 'Reset password'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
