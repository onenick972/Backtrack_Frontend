import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Button, Card, IconButton, InputAdornment, MenuItem, Stack, Table,
  TableHead, TableBody, TableRow, TableCell, TextField, Typography,
  Link as MuiLink, Grid, Divider,
} from '@mui/material';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useInvoices, useCreateInvoice } from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell, StatusBadge } from '@/components/ui/UI';
import { CustomerAutocompleteSelect } from '@/components/CustomerAutocompleteSelect';
import { formatCurrency, formatDate } from '@/utils/format';
import { can } from '@/utils/permissions';
import type { InvoiceStatus, Customer } from '@/types';
import { useAuthStore } from '@/api/authStore';
import toast from 'react-hot-toast';
import { humanizeError } from '@/utils/errors';
import { colors } from '@/theme';

interface ItemRow { description: string; quantity: number; unitPrice: number; }
const emptyItem = (): ItemRow => ({ description: '', quantity: 1, unitPrice: 0 });

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const canEdit = can.createInvoices(user);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInvoices({ search, status: status || undefined, page, pageSize: 25 });

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box>
      <PageHeader title="Invoices" eyebrow="Receivables"
        actions={canEdit ? (
          <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
            New invoice
          </Button>
        ) : undefined}
      >
        Generate invoices, track status, and reconcile against payments received.
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
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by invoice number, customer, or reference…"
            size="small" sx={{ flex: 1 }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }
            }}
          />
          <TextField select size="small" value={status} sx={{ minWidth: 160 }}
            onChange={e => { setStatus(e.target.value as InvoiceStatus | ''); setPage(1); }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Sent">Sent</MenuItem>
            <MenuItem value="PartiallyPaid">Partially Paid</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Overdue">Overdue</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </TextField>
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
          <EmptyState title="No invoices found" description="Try a different filter or create a new invoice." />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Issue date</TableCell>
                <TableCell>Due date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <MuiLink component={Link} to={`/invoices/${inv.id}`} sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      {inv.invoiceNumber}
                    </MuiLink>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{inv.customerName}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{formatDate(inv.issueDate)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(inv.total, inv.currency)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>
                    {formatCurrency(inv.balance, inv.currency)}
                  </TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
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
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}>
          <Button size="small" variant="text" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <Box>Page {page} of {Math.ceil(data.total / data.pageSize)}</Box>
          <Button size="small" variant="text" disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </Stack>
      )}
      {modalOpen && <CreateInvoiceModal onClose={() => setModalOpen(false)} />}
    </Box>
  );
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const create = useCreateInvoice();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState(0.14);
  const [discount, setDiscount] = useState(0);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const taxAmount = (subtotal - discount) * taxRate;
  const total = subtotal - discount + taxAmount;

  const updateItem = (idx: number, patch: Partial<ItemRow>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customer) { setFormError('Select a customer'); return; }
    if (items.length === 0 || items.some(i => !i.description)) {
      setFormError('Add at least one line item');
      return;
    }
    try {
      await create.mutateAsync({
        customerId: customer.id,
        dueDate, taxRate,
        discountAmount: discount,
        reference: reference || null, notes: notes || null,
        items: items.map((it, idx) => ({ ...it, sortOrder: idx })),
      });
      toast.success('Invoice created');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to create invoice'));
    }
  };

  return (
    <Modal open onClose={onClose} title="New invoice" maxWidth="lg"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  display: 'block',
                  mb: 0.5
                }}>Customer *</Typography>
              <CustomerAutocompleteSelect mode="single" value={customer} onChange={setCustomer} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField type="date" label="Due date" required fullWidth
                         value={dueDate} onChange={e => setDueDate(e.target.value)}
                         slotProps={{
                           inputLabel: { shrink: true }
                         }} />
            </Grid>
          </Grid>

          <Box>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1
              }}>
              <Typography variant="overline" sx={{
                color: "text.secondary"
              }}>Line items</Typography>
              <Button size="small" variant="text" onClick={() => setItems([...items, emptyItem()])}>
                + Add line
              </Button>
            </Stack>
            <Box sx={{ border: 1, borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right" sx={{ width: 96 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ width: 128 }}>Unit price</TableCell>
                    <TableCell align="right" sx={{ width: 128 }}>Total</TableCell>
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ p: 0.5 }}>
                        <TextField size="small" fullWidth placeholder="Item description"
                                   value={it.description}
                                   onChange={e => updateItem(idx, { description: e.target.value })} />
                      </TableCell>
                      <TableCell sx={{ p: 0.5 }} align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={it.quantity}
                          onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                          slotProps={{
                            input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                            htmlInput: { step: 'any', min: 0 }
                          }} />
                      </TableCell>
                      <TableCell sx={{ p: 0.5 }} align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={it.unitPrice}
                          onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) })}
                          slotProps={{
                            input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                            htmlInput: { step: '0.01', min: 0 }
                          }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {formatCurrency(it.quantity * it.unitPrice)}
                      </TableCell>
                      <TableCell align="center">
                        {items.length > 1 && (
                          <IconButton size="small" sx={{ '&:hover': { color: colors.danger } }}
                            onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                            <Trash2 size={13} strokeWidth={1.5} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <TextField label="Reference (PO #, etc.)" fullWidth value={reference}
                           onChange={e => setReference(e.target.value)} />
                <TextField label="Notes" fullWidth multiline minRows={2} value={notes}
                           onChange={e => setNotes(e.target.value)} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ bgcolor: colors.ink[50], p: 2, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.875rem' }}>
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      color: 'text.secondary'
                    }}>
                    <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: 'text.secondary'
                    }}>
                    <span>Discount</span>
                    <TextField size="small" type="number" value={discount}
                               onChange={e => setDiscount(Number(e.target.value))} sx={{ width: 112 }}
                               slotProps={{
                                 htmlInput: { step: '0.01', min: 0 }
                               }} />
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: 'text.secondary'
                    }}>
                    <span>Tax rate</span>
                    <TextField size="small" type="number" value={taxRate}
                               onChange={e => setTaxRate(Number(e.target.value))} sx={{ width: 112 }}
                               slotProps={{
                                 htmlInput: { step: '0.001', min: 0, max: 1 }
                               }} />
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}>
                    <span>Tax amount</span><span>{formatCurrency(taxAmount)}</span>
                  </Stack>
                  <Divider />
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: 'text.primary'
                    }}>
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create invoice'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
