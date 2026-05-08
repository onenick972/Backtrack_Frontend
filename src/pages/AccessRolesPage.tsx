import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Search, Check, AlertCircle, Lock, Plus, Trash2, Save, RotateCcw,
  Users as UsersIcon, ShieldCheck, KeyRound,
} from 'lucide-react';
import {
  Box, Button, Card, Checkbox, FormControlLabel, Grid, IconButton, InputAdornment,
  MenuItem, Select, Stack, Table, TableHead, TableBody, TableRow, TableCell,
  TextField, Typography, Alert, Tabs, Tab, Divider, FormHelperText,
} from '@mui/material';
import {
  useUsers, useUpdateUser,
  useRoles, usePermissionCatalog, useCreateRole, useUpdateRole, useDeleteRole,
} from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell } from '@/components/ui/UI';
import { useAuthStore } from '@/api/authStore';
import { can } from '@/utils/permissions';
import type { UserListItem, Role, PermissionDescriptor } from '@/types';
import toast from 'react-hot-toast';
import { showError, humanizeError } from '@/utils/errors';
import { useAppConfirm } from '@/utils/confirm';
import { colors } from '@/theme';

type TabKey = 'users' | 'matrix' | 'overview';

export default function AccessRolesPage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('users');

  if (!can.manageRoles(me)) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ color: 'text.disabled', mb: 1 }}>
          <ShieldCheck size={28} strokeWidth={1.5} />
        </Box>
        <Typography sx={{
          fontWeight: 500
        }}>Roles management permission required</Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 0.5
          }}>
          Only users with the{' '}
          <Box component="code" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>roles.manage</Box>{' '}
          permission can edit access settings.
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      <PageHeader title="Access Roles" eyebrow="Permissions">
        Toggle role assignments for staff, edit which permissions each role grants,
        and create custom roles for non-standard responsibilities.
      </PageHeader>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="users" label="Users & Roles"
               iconPosition="start" icon={<UsersIcon size={14} strokeWidth={1.5} />} />
          <Tab value="matrix" label="Permission Matrix"
               iconPosition="start" icon={<ShieldCheck size={14} strokeWidth={1.5} />} />
          <Tab value="overview" label="Roles"
               iconPosition="start" icon={<KeyRound size={14} strokeWidth={1.5} />} />
        </Tabs>

        {tab === 'users' && <UsersTab />}
        {tab === 'matrix' && <MatrixTab />}
        {tab === 'overview' && <RolesTab />}
      </Card>
    </Box>
  );
}

// ───── Tab 1: Users & Roles ─────
function UsersTab() {
  const { data: users, isLoading: usersLoading } = useUsers({ activeOnly: true });
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string>('');

  const filtered = useMemo(() => {
    if (!users) return [];
    let list = users;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (filterRoleId) list = list.filter(u => u.roleId === filterRoleId);
    return list;
  }, [users, search, filterRoleId]);

  if (usersLoading || rolesLoading) return (
    <Box sx={{
      p: 2
    }}><LoadingShell /></Box>
  );
  if (!roles) return <EmptyState title="No roles" description="Roles haven't loaded." />;

  return (
    <>
      <Grid container spacing={1} sx={{ p: 2, bgcolor: colors.ink[50], borderBottom: 1, borderColor: 'divider' }}>
        {roles.map(role => (
          <Grid size={{ xs: 6, md: 4, lg: 12 / 5 }} key={role.id}>
            <Box
              onClick={() => setFilterRoleId(filterRoleId === role.id ? '' : role.id)}
              sx={{
                cursor: 'pointer', textAlign: 'left', px: 1.5, py: 1,
                bgcolor: '#fff',
                border: 1,
                borderColor: filterRoleId === role.id ? colors.accent.main : 'divider',
                color: filterRoleId === role.id ? 'text.primary' : 'text.secondary',
                '&:hover': { borderColor: filterRoleId === role.id ? colors.accent.main : colors.ink[400] },
              }}>
              <Typography variant="overline" noWrap component="div" sx={{
                color: "text.secondary"
              }}>
                {role.name}
                {!role.isBuiltIn && <Box component="span" sx={{ ml: 0.5, color: colors.accent.main }}>·custom</Box>}
              </Typography>
              <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: '1.5rem', fontWeight: 400 }}>
                {role.activeUserCount}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
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
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }
          }}
        />
        {filterRoleId && (
          <Button size="small" variant="text" onClick={() => setFilterRoleId('')}>
            Clear filter
          </Button>
        )}
        <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
          {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
        </Typography>
      </Stack>
      {filtered.length === 0 ? (
        <EmptyState title="No users match"
                    description={search || filterRoleId
                      ? 'Try removing filters.'
                      : 'Invite users from the Users page.'} />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(u => <UserRoleRow key={u.id} user={u} roles={roles} />)}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function UserRoleRow({ user, roles }: { user: UserListItem; roles: Role[] }) {
  const update = useUpdateUser();
  const { user: me } = useAuthStore();
  const confirm = useAppConfirm();
  const isMe = user.id === me?.id;

  const onChangeRole = async (newRoleId: string) => {
    if (newRoleId === user.roleId) return;
    if (isMe) { toast.error("You cannot change your own role"); return; }

    const newRole = roles.find(r => r.id === newRoleId);
    if (!newRole) return;

    if (user.roleName === 'Admin' && newRole.name !== 'Admin') {
      if (!(await confirm({
        kind: 'warning',
        title: 'Remove Admin access',
        message: `Remove Admin access from ${user.fullName}? They will lose access to user and role management.`,
        confirmLabel: 'Remove Admin',
      }))) return;
    }
    try {
      await update.mutateAsync({
        id: user.id, fullName: user.fullName, role: user.role,
        roleId: newRoleId, isActive: user.isActive,
      });
      toast.success(`${user.fullName} is now ${newRole.name}`);
    } catch (err) {
      showError(err, 'Failed to update role');
    }
  };

  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 500 }}>
        {user.fullName}
        {isMe && (
          <Box component="span" sx={{
            ml: 1, display: 'inline-block', px: 1, py: 0.25,
            fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            bgcolor: 'rgba(197,165,114,0.1)', color: colors.accent.dark,
            border: '1px solid rgba(197,165,114,0.3)',
          }}>You</Box>
        )}
      </TableCell>
      <TableCell sx={{ fontSize: '0.875rem' }}>{user.email}</TableCell>
      <TableCell>
        <Box>
          <Select
            size="small"
            value={user.roleId ?? ''}
            onChange={e => onChangeRole(e.target.value)}
            disabled={isMe || update.isPending}
            sx={{ minWidth: 180 }}
          >
            {roles.map(r => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}{r.isBuiltIn ? '' : ' (custom)'}
              </MenuItem>
            ))}
          </Select>
          {isMe && (
            <FormHelperText sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.625rem' }}>
              Cannot change own role
            </FormHelperText>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}

// ───── Tab 2: Permission Matrix ─────
function MatrixTab() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: catalog, isLoading: catLoading } = usePermissionCatalog();

  const [edits, setEdits] = useState<Map<string, Set<string>>>(new Map());
  const update = useUpdateRole();

  useEffect(() => {
    if (!roles) return;
    setEdits(prev => {
      const next = new Map(prev);
      for (const r of roles) {
        const serverSet = new Set(r.permissions);
        const localSet = next.get(r.id);
        if (!localSet) next.set(r.id, serverSet);
      }
      return next;
    });
  }, [roles]);

  const dirtyRoles = useMemo(() => {
    const dirty = new Set<string>();
    if (!roles) return dirty;
    for (const r of roles) {
      const editSet = edits.get(r.id);
      if (!editSet) continue;
      const serverSet = new Set(r.permissions);
      if (editSet.size !== serverSet.size ||
          [...editSet].some(p => !serverSet.has(p)) ||
          [...serverSet].some(p => !editSet.has(p))) {
        dirty.add(r.id);
      }
    }
    return dirty;
  }, [roles, edits]);

  const groups = useMemo(() => {
    const map = new Map<string, PermissionDescriptor[]>();
    if (!catalog) return [] as [string, PermissionDescriptor[]][];
    for (const p of catalog) {
      const arr = map.get(p.group) ?? [];
      arr.push(p);
      map.set(p.group, arr);
    }
    return Array.from(map.entries());
  }, [catalog]);

  if (rolesLoading || catLoading) return (
    <Box sx={{
      p: 2
    }}><LoadingShell /></Box>
  );
  if (!roles || !catalog) return <EmptyState title="Failed to load" />;

  const togglePermission = (roleId: string, permKey: string) => {
    setEdits(prev => {
      const next = new Map(prev);
      const set = new Set(next.get(roleId) ?? []);
      if (set.has(permKey)) set.delete(permKey);
      else set.add(permKey);
      next.set(roleId, set);
      return next;
    });
  };

  const revert = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    setEdits(prev => {
      const next = new Map(prev);
      next.set(roleId, new Set(role.permissions));
      return next;
    });
  };

  const saveAll = async () => {
    const dirtyList = roles.filter(r => dirtyRoles.has(r.id));
    if (dirtyList.length === 0) return;
    try {
      for (const r of dirtyList) {
        const perms = Array.from(edits.get(r.id) ?? []);
        await update.mutateAsync({ id: r.id, permissions: perms });
      }
      toast.success(`Saved permission changes to ${dirtyList.length} role${dirtyList.length === 1 ? '' : 's'}`);
    } catch (err) {
      showError(err, 'Failed to save permission changes');
    }
  };

  const dirtyCount = dirtyRoles.size;

  return (
    <>
      <Alert severity="warning" variant="outlined" icon={<AlertCircle size={14} />}
             sx={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
        Permission changes take effect on a user's <strong>next login</strong>.
        To apply them faster, force affected users to re-authenticate (their
        refresh token is invalidated automatically when their role changes).
        The Admin role is locked — Admins always hold every permission.
      </Alert>
      {dirtyCount > 0 && (
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 10,
          px: 2, py: 1.25,
          bgcolor: colors.ink[950], color: colors.ink[100],
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.875rem',
        }}>
          <Box>
            <Box component="span" sx={{
              fontWeight: 500
            }}>{dirtyCount}</Box> role
            {dirtyCount === 1 ? '' : 's'} with unsaved changes
          </Box>
          <Stack
            direction="row"
            sx={{
              gap: 1,
              alignItems: "center"
            }}>
            <Button size="small" variant="text"
                    sx={{ color: colors.ink[300], '&:hover': { color: '#fff', bgcolor: colors.ink[800] } }}
                    startIcon={<RotateCcw size={12} />}
                    onClick={() => { for (const r of roles) revert(r.id); }}>
              Discard all
            </Button>
            <Button size="small" variant="contained" color="secondary"
                    onClick={saveAll} disabled={update.isPending} startIcon={<Save size={12} />}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </Box>
      )}
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 280 }}>Capability</TableCell>
              {roles.map(r => (
                <TableCell key={r.id} align="center" sx={{ width: 110 }}>
                  <Box>
                    <Box sx={{ color: dirtyRoles.has(r.id) ? colors.accent.main : 'inherit' }}>
                      {r.name}
                      {dirtyRoles.has(r.id) && <Box component="span" sx={{ ml: 0.5 }}>●</Box>}
                    </Box>
                    <Box sx={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.5625rem',
                      textTransform: 'none', letterSpacing: 0, color: colors.ink[400],
                    }}>
                      {r.isSystemAdmin ? 'all perms' : r.isBuiltIn ? 'built-in' : 'custom'}
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map(([groupName, perms]) => (
              <PermGroup key={groupName} name={groupName} perms={perms}
                roles={roles} edits={edits} onToggle={togglePermission} />
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}

function PermGroup({ name, perms, roles, edits, onToggle }: {
  name: string;
  perms: PermissionDescriptor[];
  roles: Role[];
  edits: Map<string, Set<string>>;
  onToggle: (roleId: string, key: string) => void;
}) {
  return (
    <>
      <TableRow sx={{ bgcolor: colors.ink[50] }}>
        <TableCell colSpan={roles.length + 1} sx={{
          py: 1, px: 2,
          fontSize: '0.625rem', fontFamily: '"JetBrains Mono", monospace',
          textTransform: 'uppercase', letterSpacing: '0.15em', color: colors.ink[500],
        }}>
          {name}
        </TableCell>
      </TableRow>
      {perms.map(p => (
        <TableRow key={p.key}>
          <TableCell sx={{ px: 2, py: 1.25 }}>
            <Typography variant="body2">{p.description}</Typography>
            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.disabled' }}>
              {p.key}
            </Typography>
          </TableCell>
          {roles.map(r => {
            const checked = (edits.get(r.id) ?? new Set()).has(p.key);
            const locked = r.isSystemAdmin;
            return (
              <TableCell key={r.id} align="center">
                <Box
                  component="button"
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(r.id, p.key)}
                  title={locked ? 'Admin always holds every permission' : checked ? 'Granted' : 'Not granted'}
                  sx={{
                    width: 20, height: 20,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    p: 0,
                    bgcolor: locked
                      ? colors.ink[50]
                      : checked
                        ? '#059669'
                        : '#fff',
                    borderColor: locked
                      ? colors.ink[200]
                      : checked
                        ? '#047857'
                        : colors.ink[300],
                    '&:hover': locked ? {} : checked
                      ? { filter: 'brightness(1.1)' }
                      : { borderColor: colors.ink[500] },
                  }}
                >
                  {locked ? <Lock size={10} color={colors.ink[500]} />
                          : checked ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
                </Box>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

// ───── Tab 3: Roles ─────
function RolesTab() {
  const { data: roles, isLoading } = useRoles();
  const del = useDeleteRole();
  const confirm = useAppConfirm();
  const [creatorOpen, setCreatorOpen] = useState(false);

  if (isLoading) return (
    <Box sx={{
      p: 2
    }}><LoadingShell /></Box>
  );
  if (!roles) return <EmptyState title="No roles" />;

  const handleDelete = async (r: Role) => {
    if (r.isBuiltIn) return;
    if (!(await confirm({
      kind: 'danger',
      title: 'Delete custom role',
      message: `Delete the custom role "${r.name}"? Users currently assigned to this role must be moved to a different role first.`,
      confirmLabel: 'Delete role',
    }))) return;
    try {
      await del.mutateAsync(r.id);
      toast.success('Role deleted');
    } catch (err) {
      showError(err, 'Failed to delete role');
    }
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          {roles.length} {roles.length === 1 ? 'role' : 'roles'} —{' '}
          {roles.filter(r => r.isBuiltIn).length} built-in,{' '}
          {roles.filter(r => !r.isBuiltIn).length} custom
        </Typography>
        <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setCreatorOpen(true)}>
          Create custom role
        </Button>
      </Stack>
      <Grid container spacing={2} sx={{ p: 3 }}>
        {roles.map(role => (
          <Grid size={{ xs: 12, md: 6 }} key={role.id}>
            <Box sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  mb: 1,
                  gap: 1.5
                }}>
                <Typography variant="h3" sx={{
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {role.name}
                  {role.isSystemAdmin && (
                    <Box component="span" sx={{ ml: 1, color: 'text.disabled', display: 'inline-flex' }}>
                      <Lock size={14} strokeWidth={1.5} />
                    </Box>
                  )}
                </Typography>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    gap: 1.5,
                    flexShrink: 0
                  }}>
                  <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
                    {role.activeUserCount} {role.activeUserCount === 1 ? 'user' : 'users'}
                  </Typography>
                  {!role.isBuiltIn && (
                    <IconButton size="small" sx={{ '&:hover': { color: colors.danger } }}
                                onClick={() => handleDelete(role)} title="Delete custom role">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
              <Stack
                direction="row"
                sx={{
                  gap: 1,
                  mb: 1.5
                }}>
                <Box component="span" sx={{
                  display: 'inline-block', px: 1, py: 0.25,
                  fontSize: '0.625rem', fontFamily: '"JetBrains Mono", monospace',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  bgcolor: role.isBuiltIn ? colors.ink[100] : 'rgba(197,165,114,0.1)',
                  color: role.isBuiltIn ? colors.ink[600] : colors.accent.dark,
                  border: '1px solid',
                  borderColor: role.isBuiltIn ? colors.ink[200] : 'rgba(197,165,114,0.3)',
                }}>
                  {role.isBuiltIn ? 'Built-in' : 'Custom'}
                </Box>
                {role.isSystemAdmin && (
                  <Box component="span" sx={{
                    display: 'inline-block', px: 1, py: 0.25,
                    fontSize: '0.625rem', fontFamily: '"JetBrains Mono", monospace',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    bgcolor: '#faf5ff', color: '#6b21a8',
                    border: '1px solid #e9d5ff',
                  }}>
                    All permissions
                  </Box>
                )}
              </Stack>
              {role.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mb: 1.5
                  }}>
                  {role.description}
                </Typography>
              )}
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  display: 'block',
                  mb: 0.5
                }}>
                {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Edit permissions on the Permission Matrix tab.
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      {creatorOpen && <CreateRoleModal onClose={() => setCreatorOpen(false)} />}
    </>
  );
}

function CreateRoleModal({ onClose }: { onClose: () => void }) {
  const { data: catalog } = usePermissionCatalog();
  const create = useCreateRole();
  const confirm = useAppConfirm();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!catalog) return [];
    const map = new Map<string, PermissionDescriptor[]>();
    for (const p of catalog) {
      const arr = map.get(p.group) ?? [];
      arr.push(p);
      map.set(p.group, arr);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError('Name is required'); return; }
    if (selected.size === 0) {
      if (!(await confirm({
        kind: 'warning',
        title: 'Empty role?',
        message: 'Create a role with no permissions? Members assigned to it will be effectively blocked from doing anything.',
        confirmLabel: 'Create anyway',
      }))) return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(selected),
      });
      toast.success(`Created role "${name}"`);
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to create role'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Create custom role" maxWidth="lg"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Alert severity="info" variant="outlined">
            Custom roles let you define new responsibilities (e.g., "Senior Clerk")
            using any combination of existing permissions. They live alongside the
            built-in roles and can be edited in the Permission Matrix tab.
          </Alert>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Role name" required fullWidth value={name}
                         onChange={e => setName(e.target.value)} placeholder="e.g. Senior Clerk" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Description" fullWidth value={description}
                         onChange={e => setDescription(e.target.value)}
                         placeholder="Brief explanation of this role's responsibilities" />
            </Grid>
          </Grid>

          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                display: 'block',
                mb: 0.5
              }}>
              Permissions ({selected.size} selected)
            </Typography>
            <Box sx={{ border: 1, borderColor: 'divider', maxHeight: 320, overflowY: 'auto' }}>
              {groups.map(([group, perms]) => {
                const allInGroup = perms.every(p => selected.has(p.key));
                const noneInGroup = perms.every(p => !selected.has(p.key));
                return (
                  <Box key={group}>
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: 'rgba(241,241,243,0.7)',
                        px: 1.5,
                        py: 1,
                        borderBottom: 1,
                        borderColor: colors.ink[100]
                      }}>
                      <Typography variant="overline" sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>
                        {group}
                      </Typography>
                      <Button size="small" variant="text"
                        onClick={() => {
                          setSelected(prev => {
                            const next = new Set(prev);
                            if (allInGroup) for (const p of perms) next.delete(p.key);
                            else for (const p of perms) next.add(p.key);
                            return next;
                          });
                        }}
                        sx={{ fontSize: '0.625rem', fontFamily: '"JetBrains Mono", monospace' }}>
                        {allInGroup ? 'Clear all' : noneInGroup ? 'Select all' : 'Toggle all'}
                      </Button>
                    </Stack>
                    {perms.map(p => (
                      <FormControlLabel key={p.key}
                        sx={{
                          width: '100%', m: 0, px: 1.5, py: 1,
                          alignItems: 'flex-start',
                          borderBottom: 1, borderColor: colors.ink[100],
                          '&:last-child': { borderBottom: 0 },
                          '&:hover': { bgcolor: 'rgba(241,241,243,0.5)' },
                        }}
                        control={<Checkbox checked={selected.has(p.key)} onChange={() => toggle(p.key)} sx={{ mt: 0.25 }} />}
                        label={
                          <Box>
                            <Typography variant="body2">{p.description}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.disabled' }}>
                              {p.key}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create role'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
