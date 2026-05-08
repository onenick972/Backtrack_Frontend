import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Button, Card, IconButton, InputAdornment, Stack, Table, TableHead, TableBody,
  TableRow, TableCell, TextField, Typography, Link as MuiLink, Grid, Divider,
} from '@mui/material';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell } from '@/components/ui/UI';
import { formatDate } from '@/utils/format';
import { can } from '@/utils/permissions';
import type { Customer } from '@/types';
import { useAuthStore } from '@/api/authStore';
import toast from 'react-hot-toast';
import { humanizeError, showError } from '@/utils/errors';
import { useAppConfirm } from '@/utils/confirm';
import { colors } from '@/theme';

const empty: Partial<Customer> = { name: '', email: '', phone: '', mmgWalletId: '', address: '', taxId: '', notes: '', isActive: true };

export default function CustomersPage() {
  const { user } = useAuthStore();
  const canEdit = can.editCustomers(user);
  const canDelete = can.deactivateCustomers(user);
  const confirm = useAppConfirm();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCustomers({ search, page, pageSize: 25 });
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const del = useDeleteCustomer();
  const [modal, setModal] = useState<{ open: boolean; customer: Partial<Customer> }>({ open: false, customer: empty });
  const [formError, setFormError] = useState<string | null>(null);

  const closeModal = () => {
    setModal({ open: false, customer: empty });
    setFormError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const c = modal.customer;
    const phone = (c.phone || '').trim();
    const taxId = (c.taxId || '').trim();
    const idNumber = (c.idNumber || '').trim();
    const passport = (c.passportNumber || '').trim();

    if (!phone) { setFormError('Phone number is required'); return; }
    if (!taxId && !idNumber && !passport) {
      setFormError('At least one of Tax ID, ID Number, or Passport Number is required');
      return;
    }

    try {
      if (modal.customer.id) {
        await update.mutateAsync(modal.customer as Customer);
        toast.success('Customer updated');
      } else {
        await create.mutateAsync(modal.customer);
        toast.success('Customer created');
      }
      closeModal();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to save customer'));
    }
  };

  const setField = <K extends keyof Customer>(key: K, val: Customer[K]) =>
    setModal(m => ({ ...m, customer: { ...m.customer, [key]: val } }));

  return (
    <Box>
      <PageHeader
        title="Customers"
        eyebrow="Directory"
        actions={canEdit ? (
          <Button variant="contained" startIcon={<Plus size={14} strokeWidth={2} />}
                  onClick={() => setModal({ open: true, customer: empty })}>
            New customer
          </Button>
        ) : undefined}
      >
        Manage customer information, contact details, and MMG wallet associations.
      </PageHeader>
      <Card sx={{ mb: 2 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 1.5,
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
          <TextField
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, code, email, or phone…"
            size="small"
            sx={{ flex: 1 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search size={16} strokeWidth={1.5} /></InputAdornment>,
              }
            }}
          />
          {data && (
            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
              {data.total} total
            </Typography>
          )}
        </Stack>

        {isLoading ? (
          <Box sx={{
            p: 2
          }}><LoadingShell /></Box>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No customers found" description="Try a different search or create a new customer." />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>MMG Wallet</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map(c => (
                <TableRow key={c.id}>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                    <MuiLink component={Link} to={`/customers/${c.id}`}>{c.customerCode}</MuiLink>
                  </TableCell>
                  <TableCell>
                    <MuiLink component={Link} to={`/customers/${c.id}`} underline="none" sx={{
                      fontWeight: 500
                    }}>
                      {c.name}
                    </MuiLink>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.email || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {c.phone || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {c.mmgWalletId || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    {c.isActive
                      ? <ActiveBadge />
                      : <InactiveBadge />}
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "flex-end",
                        gap: 0.5
                      }}>
                      {canEdit && (
                        <IconButton size="small" onClick={() => setModal({ open: true, customer: c })}>
                          <Edit2 size={14} strokeWidth={1.5} />
                        </IconButton>
                      )}
                      {canDelete && c.isActive && (
                        <IconButton size="small" sx={{ '&:hover': { color: colors.danger, bgcolor: '#fff1f2' } }}
                          onClick={async () => {
                            if (await confirm({
                              kind: 'danger',
                              title: 'Deactivate customer',
                              message: `Deactivate ${c.name}? They'll no longer appear in selection lists, but their existing invoices and history are preserved.`,
                              confirmLabel: 'Deactivate',
                            })) {
                              try {
                                await del.mutateAsync(c.id);
                                toast.success('Customer deactivated');
                              } catch (err) {
                                showError(err, 'Failed to deactivate customer');
                              }
                            }
                          }}>
                          <Trash2 size={14} strokeWidth={1.5} />
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
      {data && data.total > data.pageSize && (
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            fontSize: '0.75rem',
            fontFamily: '"JetBrains Mono", monospace',
            color: 'text.secondary'
          }}>
          <Button size="small" variant="text" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <Box>Page {page} of {Math.ceil(data.total / data.pageSize)}</Box>
          <Button size="small" variant="text" disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </Stack>
      )}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.customer.id ? 'Edit customer' : 'New customer'}
        maxWidth="sm"
        error={formError}
        onDismissError={() => setFormError(null)}
      >
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField label="Name" required fullWidth value={modal.customer.name || ''}
                       onChange={e => setField('name', e.target.value)} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Phone" required fullWidth value={modal.customer.phone || ''}
                           onChange={e => setField('phone', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Email" type="email" fullWidth value={modal.customer.email || ''}
                           onChange={e => setField('email', e.target.value)} />
              </Grid>
            </Grid>

            <Divider />
            <Box>
              <Stack
                direction="row"
                sx={{
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  mb: 1
                }}>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>Identification</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontStyle: "italic"
                  }}>
                  At least one required
                </Typography>
              </Stack>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Tax ID (TIN)" fullWidth value={modal.customer.taxId || ''}
                             onChange={e => setField('taxId', e.target.value)}
                             slotProps={{
                               input: { sx: { fontFamily: '"JetBrains Mono", monospace' } }
                             }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="ID Number" fullWidth value={modal.customer.idNumber || ''}
                             onChange={e => setField('idNumber', e.target.value)}
                             slotProps={{
                               input: { sx: { fontFamily: '"JetBrains Mono", monospace' } }
                             }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Passport No." fullWidth value={modal.customer.passportNumber || ''}
                             onChange={e => setField('passportNumber', e.target.value)}
                             slotProps={{
                               input: { sx: { fontFamily: '"JetBrains Mono", monospace' } }
                             }} />
                </Grid>
              </Grid>
            </Box>

            <TextField label="MMG Wallet ID" fullWidth value={modal.customer.mmgWalletId || ''}
                       onChange={e => setField('mmgWalletId', e.target.value)}
                       slotProps={{
                         input: { sx: { fontFamily: '"JetBrains Mono", monospace' } }
                       }} />
            <TextField label="Address" fullWidth multiline minRows={2} value={modal.customer.address || ''}
                       onChange={e => setField('address', e.target.value)} />
            <TextField label="Notes" fullWidth multiline minRows={2} value={modal.customer.notes || ''}
                       onChange={e => setField('notes', e.target.value)} />

            <Divider />
            <Stack
              direction="row"
              sx={{
                justifyContent: "flex-end",
                gap: 1
              }}>
              <Button variant="outlined" onClick={closeModal}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={create.isPending || update.isPending}>
                {modal.customer.id ? 'Save changes' : 'Create customer'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}

function ActiveBadge() {
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: '#ecfdf5', color: '#065f46',
      border: '1px solid #a7f3d0',
    }}>Active</Box>
  );
}
function InactiveBadge() {
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: colors.ink[100], color: colors.ink[500],
      border: '1px solid', borderColor: colors.ink[200],
    }}>Inactive</Box>
  );
}
