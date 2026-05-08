import { useState } from 'react';
import {
  Box, Card, Stack, TextField, MenuItem, InputAdornment, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, Button, Grid,
} from '@mui/material';
import { Search, FileText } from 'lucide-react';
import { useAuditLogs } from '@/api/hooks';
import { api } from '@/api/client';
import { PageHeader, Modal, EmptyState, LoadingShell } from '@/components/ui/UI';
import { formatDateTime } from '@/utils/format';
import type { AuditLog } from '@/types';
import { colors } from '@/theme';

interface AuditLogDetail extends AuditLog {
  beforeState?: string;
  afterState?: string;
  userAgent?: string;
}

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAuditLogs({
    entityType: entityType || undefined,
    action: action || undefined,
    page, pageSize: 50,
  });

  const filtered = data?.items.filter(log =>
    !search || (log.description?.toLowerCase().includes(search.toLowerCase()))
           || log.userEmail?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const [selected, setSelected] = useState<AuditLogDetail | null>(null);

  const openDetail = async (id: string) => {
    const { data } = await api.get<AuditLogDetail>(`/audit/${id}`);
    setSelected(data);
  };

  return (
    <Box>
      <PageHeader title="Audit Log" eyebrow="Compliance & Security">
        Every mutation is recorded — who did what, when, from where, and what changed.
      </PageHeader>
      <Card sx={{ mb: 2 }}>
        <Stack
          direction="row"
          sx={{
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search description or user…"
            size="small"
            sx={{ flex: 1, minWidth: 240 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} strokeWidth={1.5} />
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            select size="small" value={entityType}
            onChange={e => { setEntityType(e.target.value); setPage(1); }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All entities</MenuItem>
            <MenuItem value="Customer">Customer</MenuItem>
            <MenuItem value="Invoice">Invoice</MenuItem>
            <MenuItem value="Payment">Payment</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="BankStatementBatch">Bank batch</MenuItem>
          </TextField>
          <TextField
            select size="small" value={action}
            onChange={e => { setAction(e.target.value); setPage(1); }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All actions</MenuItem>
            <MenuItem value="CREATE">Create</MenuItem>
            <MenuItem value="UPDATE">Update</MenuItem>
            <MenuItem value="DELETE">Delete</MenuItem>
            <MenuItem value="LOGIN">Login</MenuItem>
          </TextField>
          {data && (
            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
              {data.total} events
            </Typography>
          )}
        </Stack>

        {isLoading ? (
          <Box sx={{
            p: 2
          }}><LoadingShell /></Box>
        ) : filtered.length === 0 ? (
          <EmptyState title="No audit events" description="Activity will appear here as users interact with the system." />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>IP</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(log => (
                <TableRow key={log.id}>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {formatDateTime(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    {log.userEmail || (
                      <Typography component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                        system
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell><ActionBadge action={log.action} /></TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                    {log.entityType}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 400 }}>
                    <Typography variant="body2" noWrap title={log.description || ''}>
                      {log.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {log.ipAddress || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => openDetail(log.id)}
                      startIcon={<FileText size={12} />}
                    >
                      View
                    </Button>
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
          <Button size="small" variant="text" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </Button>
          <Box>Page {page} of {Math.ceil(data.total / data.pageSize)}</Box>
          <Button size="small" variant="text" disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}>
            Next →
          </Button>
        </Stack>
      )}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title="Audit event" maxWidth="lg">
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><Field label="Timestamp" value={formatDateTime(selected.timestamp)} mono /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Field label="Action" value={selected.action} mono /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Field label="Entity" value={`${selected.entityType}${selected.entityId ? ' · ' + selected.entityId : ''}`} mono /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Field label="User" value={selected.userEmail || 'system'} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Field label="IP address" value={selected.ipAddress || '—'} mono /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Field label="User agent" value={selected.userAgent || '—'} small /></Grid>
            </Grid>
            {selected.description && (
              <Box>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>Description</Typography>
                <Typography variant="body2">{selected.description}</Typography>
              </Box>
            )}
            {selected.beforeState && (
              <Box>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>Before</Typography>
                <Box component="pre" sx={{
                  bgcolor: colors.ink[950], color: colors.ink[100],
                  p: 2, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace',
                  overflowX: 'auto', m: 0,
                }}>
                  {tryFormatJson(selected.beforeState)}
                </Box>
              </Box>
            )}
            {selected.afterState && (
              <Box>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>After</Typography>
                <Box component="pre" sx={{
                  bgcolor: colors.ink[950], color: colors.ink[100],
                  p: 2, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace',
                  overflowX: 'auto', m: 0,
                }}>
                  {tryFormatJson(selected.afterState)}
                </Box>
              </Box>
            )}
          </Stack>
        </Modal>
      )}
    </Box>
  );
}

function Field({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <Box>
      <Typography variant="overline" sx={{
        color: "text.secondary"
      }}>{label}</Typography>
      <Typography sx={{
        fontFamily: mono ? '"JetBrains Mono", monospace' : undefined,
        fontSize: mono || small ? '0.75rem' : '0.875rem',
        wordBreak: 'break-word',
      }}>
        {value}
      </Typography>
    </Box>
  );
}

function ActionBadge({ action }: { action: string }) {
  const palette: Record<string, { bg: string; text: string; border: string }> = {
    CREATE: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    UPDATE: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    DELETE: { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
    LOGIN:  { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
  };
  const p = palette[action] || { bg: colors.ink[100], text: colors.ink[700], border: colors.ink[200] };
  return (
    <Box component="span" sx={{
      display: 'inline-block',
      px: 1, py: 0.25,
      fontSize: '0.6875rem',
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      bgcolor: p.bg,
      color: p.text,
      border: '1px solid',
      borderColor: p.border,
    }}>
      {action}
    </Box>
  );
}

function tryFormatJson(s: string): string {
  try { return JSON.stringify(JSON.parse(s), null, 2); }
  catch { return s; }
}
