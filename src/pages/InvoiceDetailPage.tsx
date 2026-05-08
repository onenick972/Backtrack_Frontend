import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Button, Card, Grid, MenuItem, Stack, Table, TableHead, TableBody,
  TableRow, TableCell, TextField, Typography, Link as MuiLink, Divider,
} from '@mui/material';
import { ArrowLeft, Send, CheckCircle2, X } from 'lucide-react';
import {
  useInvoice, useUpdateInvoiceStatus, useInitiateMmg, useRecordManualPayment,
} from '@/api/hooks';
import { PageHeader, Modal, StatusBadge, LoadingShell } from '@/components/ui/UI';
import { formatCurrency, formatDate } from '@/utils/format';
import { can } from '@/utils/permissions';
import type { PaymentMethod } from '@/types';
import { useAuthStore } from '@/api/authStore';
import toast from 'react-hot-toast';
import { humanizeError, showError } from '@/utils/errors';
import { useAppConfirm } from '@/utils/confirm';
import { colors } from '@/theme';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: inv, isLoading } = useInvoice(id);
  const { user } = useAuthStore();
  const canEdit = can.createInvoices(user);
  const confirm = useAppConfirm();

  const updateStatus = useUpdateInvoiceStatus();
  const [mmgOpen, setMmgOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  if (isLoading) return <LoadingShell />;
  if (!inv) return (
    <Typography sx={{
      color: "text.secondary"
    }}>Invoice not found.</Typography>
  );

  return (
    <Box>
      <MuiLink component={Link} to="/invoices" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2,
        fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace',
        textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary',
      }}>
        <ArrowLeft size={12} /> Invoices
      </MuiLink>
      <PageHeader title={inv.invoiceNumber} eyebrow={`Invoice for ${inv.customerName}`}
        actions={canEdit ? (
          <Stack direction="row" sx={{
            gap: 1
          }}>
            {inv.status === 'Draft' && (
              <Button variant="outlined" startIcon={<Send size={14} strokeWidth={1.5} />}
                onClick={async () => {
                  await updateStatus.mutateAsync({ id: inv.id, status: 'Sent' });
                  toast.success('Marked as sent');
                }}>
                Mark as sent
              </Button>
            )}
            {inv.balance > 0 && inv.status !== 'Cancelled' && (
              <>
                <Button variant="outlined" onClick={() => setMmgOpen(true)}>Initiate MMG</Button>
                <Button variant="contained" startIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                        onClick={() => setManualOpen(true)}>
                  Record payment
                </Button>
              </>
            )}
          </Stack>
        ) : undefined}
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Card>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>Line items</Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inv.items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell>{it.description}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{it.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(it.unitPrice, inv.currency)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(it.lineTotal, inv.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card sx={{ p: 2.5 }}>
              <Stack spacing={1} sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.875rem', maxWidth: 400, ml: 'auto' }}>
                <Row label="Subtotal" value={formatCurrency(inv.subtotal, inv.currency)} />
                <Row label="Discount" value={`− ${formatCurrency(inv.discountAmount, inv.currency)}`} />
                <Row label={`Tax (${(inv.taxRate * 100).toFixed(1)}%)`} value={formatCurrency(inv.taxAmount, inv.currency)} />
                <Divider />
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    fontWeight: 600
                  }}>
                  <span>Total</span><span>{formatCurrency(inv.total, inv.currency)}</span>
                </Stack>
                <Row label="Amount paid" value={`− ${formatCurrency(inv.amountPaid, inv.currency)}`} />
                <Divider />
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}>
                  <span>Balance due</span>
                  <span style={{ color: inv.balance > 0 ? colors.danger : colors.success }}>
                    {formatCurrency(inv.balance, inv.currency)}
                  </span>
                </Stack>
              </Stack>
            </Card>

            {inv.notes && (
              <Card sx={{ p: 2.5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    mb: 1,
                    display: 'block'
                  }}>Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{inv.notes}</Typography>
              </Card>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 2.5 }}>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  display: 'block',
                  mb: 1.5
                }}>Status</Typography>
              <StatusBadge status={inv.status} />
              {canEdit && inv.status !== 'Cancelled' && inv.status !== 'Paid' && (
                <Button size="small" variant="text" startIcon={<X size={12} />}
                        sx={{ mt: 1.5, color: colors.danger }}
                  onClick={async () => {
                    if (await confirm({
                      kind: 'danger',
                      title: 'Cancel invoice',
                      message: `Cancel ${inv.invoiceNumber}? The invoice will be marked Cancelled but kept in records. This can be reversed by an admin.`,
                      confirmLabel: 'Cancel invoice',
                      cancelLabel: 'Keep it',
                    })) {
                      try {
                        await updateStatus.mutateAsync({ id: inv.id, status: 'Cancelled' });
                        toast.success('Invoice cancelled');
                      } catch (err) {
                        showError(err, 'Failed to cancel invoice');
                      }
                    }
                  }}>
                  Cancel invoice
                </Button>
              )}
            </Card>

            <Card sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                <SidebarItem label="Customer" value={inv.customerName} />
                <SidebarItem label="Issue date" value={formatDate(inv.issueDate)} />
                <SidebarItem label="Due date" value={formatDate(inv.dueDate)} />
                {inv.reference && <SidebarItem label="Reference" value={inv.reference} mono />}
                <SidebarItem label="Currency" value={inv.currency} mono />
                <SidebarItem label="Created" value={formatDate(inv.createdAt)} />
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {mmgOpen && <MmgModal invoiceId={inv.id} onClose={() => setMmgOpen(false)} />}
      {manualOpen && <ManualPaymentModal invoiceId={inv.id} balance={inv.balance} onClose={() => setManualOpen(false)} />}
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        color: 'text.secondary'
      }}>
      <span>{label}</span><span>{value}</span>
    </Stack>
  );
}

function SidebarItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Typography variant="overline" sx={{
        color: "text.secondary"
      }}>{label}</Typography>
      <Typography sx={{
        fontFamily: mono ? '"JetBrains Mono", monospace' : undefined,
        fontSize: mono ? '0.75rem' : '0.875rem',
      }}>
        {value}
      </Typography>
    </Box>
  );
}

function MmgModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const initiate = useInitiateMmg();
  const [wallet, setWallet] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await initiate.mutateAsync({ invoiceId, customerWallet: wallet });
      toast.success('MMG payment initiated — awaiting confirmation');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to initiate MMG payment'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Initiate MMG payment" error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            A payment request will be sent to the customer's MMG wallet.
            The system will await webhook confirmation before marking as paid.
          </Typography>
          <TextField label="Customer MMG Wallet ID" required fullWidth value={wallet}
                     onChange={e => setWallet(e.target.value)} placeholder="e.g. 5921234567"
                     slotProps={{
                       input: { sx: { fontFamily: '"JetBrains Mono", monospace' } }
                     }} />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={initiate.isPending}>
              {initiate.isPending ? 'Initiating…' : 'Initiate payment'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function ManualPaymentModal({ invoiceId, balance, onClose }:
  { invoiceId: string; balance: number; onClose: () => void }) {
  const record = useRecordManualPayment();
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await record.mutateAsync({
        invoiceId, amount, method, paymentDate: date,
        reference: reference || null, notes: notes || null,
      });
      toast.success('Payment recorded');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to record payment'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Record payment" error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Amount"
                type="number"
                required
                fullWidth
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                helperText={`Outstanding: ${formatCurrency(balance)}`}
                slotProps={{
                  input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                  htmlInput: { step: '0.01', min: 0.01, max: balance }
                }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Payment date" type="date" required fullWidth
                         value={date} onChange={e => setDate(e.target.value)}
                         slotProps={{
                           inputLabel: { shrink: true }
                         }} />
            </Grid>
          </Grid>
          <TextField select label="Method" required value={method}
                     onChange={e => setMethod(e.target.value as PaymentMethod)} fullWidth>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Cheque">Cheque</MenuItem>
            <MenuItem value="BankTransfer">Bank transfer</MenuItem>
            <MenuItem value="Mmg">MMG (manual entry)</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
          <TextField label="Reference" fullWidth value={reference}
                     onChange={e => setReference(e.target.value)}
                     placeholder="Cheque number, transaction ID, etc."
                     slotProps={{
                       input: { sx: { fontFamily: '"JetBrains Mono", monospace' } }
                     }} />
          <TextField label="Notes" fullWidth multiline minRows={2} value={notes}
                     onChange={e => setNotes(e.target.value)} />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={record.isPending}>
              {record.isPending ? 'Recording…' : 'Record payment'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
