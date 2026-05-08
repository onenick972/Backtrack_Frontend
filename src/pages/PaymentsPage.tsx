import { useState, useRef, type FormEvent } from 'react';
import {
  Box, Button, Card, FormControlLabel, Checkbox, InputAdornment,
  MenuItem, Stack, Table, TableHead, TableBody, TableRow, TableCell, TextField,
  Typography, Grid, Divider, Radio, RadioGroup,
} from '@mui/material';
import { Upload, Search, Link2 } from 'lucide-react';
import { usePayments, useUploadBankStatement, useReconcile, useInvoices } from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell, StatusBadge } from '@/components/ui/UI';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { can } from '@/utils/permissions';
import type { Payment, PaymentMethod, PaymentStatus } from '@/types';
import { useAuthStore } from '@/api/authStore';
import toast from 'react-hot-toast';
import { humanizeError } from '@/utils/errors';
import { colors } from '@/theme';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const canEdit = can.recordPayments(user);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [unreconciledOnly, setUnreconciledOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePayments({
    search: search || undefined,
    status: status || undefined,
    method: method || undefined,
    unreconciledOnly: unreconciledOnly || undefined,
    page, pageSize: 25,
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [reconcilePayment, setReconcilePayment] = useState<Payment | null>(null);

  return (
    <Box>
      <PageHeader title="Payments" eyebrow="Receipts & Reconciliation"
        actions={canEdit ? (
          <Button variant="contained" startIcon={<Upload size={14} />} onClick={() => setUploadOpen(true)}>
            Upload bank statement
          </Button>
        ) : undefined}
      >
        Track MMG transactions, bank deposits, and manual receipts. Reconcile unmatched payments to invoices.
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
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by payment #, MMG tx, or bank ref…"
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }
            }}
          />
          <TextField select size="small" value={method} sx={{ minWidth: 140 }}
            onChange={e => { setMethod(e.target.value as PaymentMethod | ''); setPage(1); }}>
            <MenuItem value="">All methods</MenuItem>
            <MenuItem value="Mmg">MMG</MenuItem>
            <MenuItem value="BankTransfer">Bank transfer</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Cheque">Cheque</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
          <TextField select size="small" value={status} sx={{ minWidth: 140 }}
            onChange={e => { setStatus(e.target.value as PaymentStatus | ''); setPage(1); }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Failed">Failed</MenuItem>
            <MenuItem value="Refunded">Refunded</MenuItem>
          </TextField>
          <FormControlLabel
            control={<Checkbox checked={unreconciledOnly} onChange={e => { setUnreconciledOnly(e.target.checked); setPage(1); }} />}
            label={<Typography variant="overline" sx={{
              color: "text.secondary"
            }}>Unmatched only</Typography>}
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
          <EmptyState title="No payments found" description="Try a different filter or upload a bank statement." />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Payment #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Customer / Invoice</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reconciled</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map(p => (
                <TableRow key={p.id}>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>{p.paymentNumber}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{formatDateTime(p.paymentDate)}</TableCell>
                  <TableCell><MethodBadge method={p.method} /></TableCell>
                  <TableCell>
                    {p.invoiceNumber ? (
                      <Box>
                        <Typography variant="body2">{p.customerName}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
                          {p.invoiceNumber}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                        Unmatched
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {p.mmgTransactionId || p.bankReference || '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatCurrency(p.amount, p.currency)}
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                    {p.isReconciled
                      ? <Box component="span" sx={{ color: colors.success }}>✓ Yes</Box>
                      : <Box component="span" sx={{ color: colors.warning }}>Pending</Box>}
                  </TableCell>
                  <TableCell align="right">
                    {!p.isReconciled && canEdit && (
                      <Button size="small" variant="text" startIcon={<Link2 size={12} />}
                        onClick={() => setReconcilePayment(p)}>
                        Match
                      </Button>
                    )}
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
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}>
          <Button size="small" variant="text" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <Box>Page {page} of {Math.ceil(data.total / data.pageSize)}</Box>
          <Button size="small" variant="text" disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </Stack>
      )}
      {uploadOpen && <BankUploadModal onClose={() => setUploadOpen(false)} />}
      {reconcilePayment && (
        <ReconcileModal payment={reconcilePayment} onClose={() => setReconcilePayment(null)} />
      )}
    </Box>
  );
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const styles: Record<PaymentMethod, { bg: string; text: string; border: string }> = {
    Mmg:          { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
    BankTransfer: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    Cash:         { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    Cheque:       { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    Other:        { bg: colors.ink[100], text: colors.ink[700], border: colors.ink[200] },
  };
  const labels: Record<PaymentMethod, string> = {
    Mmg: 'MMG', BankTransfer: 'Bank', Cash: 'Cash', Cheque: 'Cheque', Other: 'Other',
  };
  const s = styles[method];
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: s.bg, color: s.text, border: '1px solid', borderColor: s.border,
    }}>
      {labels[method]}
    </Box>
  );
}

function BankUploadModal({ onClose }: { onClose: () => void }) {
  const upload = useUploadBankStatement();
  const [bankName, setBankName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!file) { setFormError('Select a CSV file'); return; }
    try {
      const result = await upload.mutateAsync({ file, bankName });
      toast.success(`Processed ${result.totalRows} rows: ${result.matched} matched, ${result.unmatched} unmatched`);
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to upload statement'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Upload bank statement" maxWidth="sm"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <Box sx={{
            bgcolor: colors.ink[50], border: 1, borderColor: 'divider', p: 1.5,
            fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary',
          }}>
            <Box sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>Expected CSV format:</Box>
            Date, Reference, Description, Amount<br />
            2026-04-15, INV-2026-00042, Wire from ACME Corp, 245000.00
          </Box>
          <TextField label="Bank name" required fullWidth value={bankName}
                     onChange={e => setBankName(e.target.value)}
                     placeholder="e.g. Republic Bank" />
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                display: 'block',
                mb: 0.5
              }}>
              CSV file *
            </Typography>
            <Box component="input" ref={fileRef} type="file" accept=".csv,text/csv" required
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                 sx={{
                   display: 'block', width: '100%', fontSize: '0.875rem',
                   '&::file-selector-button': {
                     mr: 1.5, py: 1, px: 2, border: 0,
                     fontSize: '0.6875rem',
                     fontFamily: '"JetBrains Mono", monospace',
                     textTransform: 'uppercase',
                     letterSpacing: '0.05em',
                     bgcolor: colors.ink[900], color: '#fff',
                     cursor: 'pointer',
                     '&:hover': { bgcolor: colors.ink[800] },
                   },
                 }} />
          </Box>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            Each row will attempt to auto-match against an invoice number (column 2 or anywhere in the description).
            Unmatched rows can be reconciled manually after upload.
          </Typography>
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={upload.isPending}>
              {upload.isPending ? 'Processing…' : 'Upload & match'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function ReconcileModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const reconcile = useReconcile();
  const [search, setSearch] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data } = useInvoices({
    search: search || undefined,
    page: 1, pageSize: 10,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await reconcile.mutateAsync({
        paymentId: payment.id,
        invoiceId: selectedInvoiceId || undefined,
        notes: notes || undefined,
      });
      toast.success('Payment reconciled');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to reconcile'));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Reconcile ${payment.paymentNumber}`} maxWidth="md"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <Box sx={{ bgcolor: colors.ink[50], p: 1.5 }}>
            <Grid container spacing={2} sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    fontSize: '0.625rem'
                  }}>Amount</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'inherit' }}>{formatCurrency(payment.amount, payment.currency)}</Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    fontSize: '0.625rem'
                  }}>Reference</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{payment.bankReference || payment.mmgTransactionId || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    fontSize: '0.625rem'
                  }}>Date</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{formatDateTime(payment.paymentDate)}</Typography>
              </Grid>
            </Grid>
          </Box>

          <TextField label="Search for invoice to attach" fullWidth value={search}
                     onChange={e => setSearch(e.target.value)}
                     placeholder="Invoice number or customer name…" />

          {data && data.items.length > 0 && (
            <Box sx={{ border: 1, borderColor: 'divider', maxHeight: 256, overflowY: 'auto' }}>
              <RadioGroup value={selectedInvoiceId || ''} onChange={(_, v) => setSelectedInvoiceId(v)}>
                {data.items.map(inv => (
                  <Box key={inv.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderBottom: 1, borderColor: colors.ink[100],
                    cursor: 'pointer',
                    '&:hover': { bgcolor: colors.ink[50] },
                    bgcolor: selectedInvoiceId === inv.id ? 'rgba(197,165,114,0.1)' : 'transparent',
                  }}
                       onClick={() => setSelectedInvoiceId(inv.id)}>
                    <Radio value={inv.id} size="small" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
                        {inv.invoiceNumber}
                      </Typography>
                      <Typography variant="body2">{inv.customerName}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {formatCurrency(inv.balance, inv.currency)}
                      </Typography>
                      <StatusBadge status={inv.status} />
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
            </Box>
          )}

          <TextField label="Reconciliation notes" fullWidth multiline minRows={2} value={notes}
                     onChange={e => setNotes(e.target.value)}
                     placeholder="Why this match was applied, any adjustments, etc." />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={reconcile.isPending}>
              {reconcile.isPending ? 'Reconciling…' : 'Confirm reconciliation'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
