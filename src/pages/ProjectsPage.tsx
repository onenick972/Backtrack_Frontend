import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import {
  Box, Button, Card, InputAdornment, LinearProgress, MenuItem, Stack, Table,
  TableHead, TableBody, TableRow, TableCell, TextField, Typography,
  Link as MuiLink, Grid, Divider,
} from '@mui/material';
import {
  useProjects, useTemplates, useCreateProject,
} from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell } from '@/components/ui/UI';
import { CustomerAutocompleteSelect } from '@/components/CustomerAutocompleteSelect';
import { formatCurrency, formatDate } from '@/utils/format';
import { can } from '@/utils/permissions';
import type { ProjectStatus, Customer } from '@/types';
import { useAuthStore } from '@/api/authStore';
import toast from 'react-hot-toast';
import { humanizeError } from '@/utils/errors';
import { colors } from '@/theme';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const canEdit = can.createProjects(user);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProjects({
    search: search || undefined,
    status: status || undefined,
    page, pageSize: 25,
  });

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box>
      <PageHeader title="Projects" eyebrow="Work in Progress"
        actions={canEdit ? (
          <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
            New project
          </Button>
        ) : undefined}
      >
        Track work delivered to customers — milestones, team, invoices, all in one place.
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
            placeholder="Search by project name, number, customer, or tag…"
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }
            }}
          />
          <TextField select size="small" value={status} sx={{ minWidth: 140 }}
            onChange={e => { setStatus(e.target.value as ProjectStatus | ''); setPage(1); }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="OnHold">On Hold</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
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
          <EmptyState
            title="No projects yet"
            description="Projects link work to a customer. Create one to start tracking milestones and generate invoices from it."
            action={canEdit ? (
              <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                Create your first project
              </Button>
            ) : undefined}
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Holder</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell align="right">Budget</TableCell>
                <TableCell align="right">Invoiced</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <MuiLink component={Link} to={`/projects/${p.id}`} underline="none">
                      <Typography variant="body2" sx={{
                        fontWeight: 500
                      }}>{p.name}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
                        {p.projectNumber}
                      </Typography>
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    {p.primaryCustomerName ? (
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                          gap: 0.75
                        }}>
                        <span>{p.primaryCustomerName}</span>
                        {p.ownerCount > 1 && (
                          <Box component="span" sx={{
                            display: 'inline-block', px: 0.75, py: 0.25,
                            fontSize: '0.625rem', fontFamily: '"JetBrains Mono", monospace',
                            bgcolor: colors.ink[100], color: colors.ink[600],
                            border: '1px solid', borderColor: colors.ink[200],
                          }}>
                            +{p.ownerCount - 1}
                          </Box>
                        )}
                      </Stack>
                    ) : <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
                  </TableCell>
                  <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>
                    {p.currentHolderUserName ?? (
                      <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unassigned</Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {p.startDate ? formatDate(p.startDate) : '—'}
                    {p.endDate ? ` → ${formatDate(p.endDate)}` : ''}
                  </TableCell>
                  <TableCell><Progress total={p.milestonesTotal} done={p.milestonesCompleted} /></TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {p.budget ? formatCurrency(p.budget, p.currency) : <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {p.invoicedTotal > 0 ? formatCurrency(p.invoicedTotal, p.currency) : <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
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
      {modalOpen && <CreateProjectModal onClose={() => setModalOpen(false)} />}
    </Box>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; Icon: typeof CheckCircle2 }> = {
    Draft:     { label: 'Draft',     bg: colors.ink[100], text: colors.ink[700], border: colors.ink[200], Icon: FolderKanban },
    Active:    { label: 'Active',    bg: '#ecfdf5',       text: '#065f46',       border: '#a7f3d0',       Icon: CheckCircle2 },
    OnHold:    { label: 'On Hold',   bg: '#fffbeb',       text: '#92400e',       border: '#fde68a',       Icon: PauseCircle },
    Completed: { label: 'Completed', bg: '#f0f9ff',       text: '#075985',       border: '#bae6fd',       Icon: CheckCircle2 },
    Cancelled: { label: 'Cancelled', bg: '#fff1f2',       text: '#9f1239',       border: '#fecdd3',       Icon: XCircle },
  };
  const c = config[status];
  const Icon = c.Icon;
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75,
      px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: c.bg, color: c.text, border: '1px solid', borderColor: c.border,
    }}>
      <Icon size={11} strokeWidth={2} /> {c.label}
    </Box>
  );
}

function Progress({ total, done }: { total: number; done: number }) {
  if (total === 0) return <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>No milestones</Box>;
  const pct = (done / total) * 100;
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1,
        minWidth: 120
      }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress variant="determinate" value={pct} sx={{
          height: 6, borderRadius: 0,
          bgcolor: colors.ink[100],
          '& .MuiLinearProgress-bar': { bgcolor: colors.accent.main },
        }} />
      </Box>
      <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {done}/{total}
      </Typography>
    </Stack>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const { data: templates } = useTemplates(true);
  const create = useCreateProject();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [primaryCustomerId, setPrimaryCustomerId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCustomersChange = (next: Customer[]) => {
    setCustomers(next);
    if (next.length === 0) {
      setPrimaryCustomerId('');
    } else if (!next.some(c => c.id === primaryCustomerId)) {
      setPrimaryCustomerId(next[0].id);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (customers.length === 0) { setFormError('Select at least one customer'); return; }
    const customerIds = customers.map(c => c.id);
    if (!primaryCustomerId || !customerIds.includes(primaryCustomerId)) {
      setFormError('Mark one of the selected customers as primary');
      return;
    }
    try {
      const proj = await create.mutateAsync({
        customerIds, primaryCustomerId, name,
        description: description || null,
        templateId: templateId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget ? Number(budget) : null,
        currency: 'GYD',
        tags: tags || null, notes: notes || null,
      }) as { id: string };
      toast.success('Project created');
      onClose();
      window.location.href = `/projects/${proj.id}`;
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to create project'));
    }
  };

  return (
    <Modal open onClose={onClose} title="New project" maxWidth="md"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                display: 'block',
                mb: 0.5
              }}>
              Customers (one or more) *
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: 'block',
                mb: 1
              }}>
              Search and add customers who own this project. Click the star on a chip to mark them as primary — invoices will default to them.
            </Typography>
            <CustomerAutocompleteSelect
              mode="multi"
              value={customers}
              onChange={handleCustomersChange}
              primaryId={primaryCustomerId}
              onPrimaryChange={setPrimaryCustomerId}
            />
            {customers.length > 0 && (
              <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary', mt: 1, display: 'block' }}>
                {customers.length} selected
                {primaryCustomerId && ` · primary set`}
              </Typography>
            )}
          </Box>

          <TextField select label="Template (optional)" fullWidth value={templateId}
                     onChange={e => setTemplateId(e.target.value)}
                     helperText="Templates auto-fill milestones and default invoice items">
            <MenuItem value="">No template</MenuItem>
            {templates?.map(t => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>

          <TextField label="Project name" required fullWidth value={name}
                     onChange={e => setName(e.target.value)}
                     placeholder="e.g. Website redesign Q2 2026" />
          <TextField label="Description" fullWidth multiline minRows={2}
                     value={description} onChange={e => setDescription(e.target.value)}
                     placeholder="Brief summary of scope and objectives" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Start date" type="date" fullWidth
                         value={startDate} onChange={e => setStartDate(e.target.value)}
                         slotProps={{
                           inputLabel: { shrink: true }
                         }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="End date" type="date" fullWidth
                         value={endDate} onChange={e => setEndDate(e.target.value)}
                         slotProps={{
                           inputLabel: { shrink: true }
                         }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Budget (GYD)"
                type="number"
                fullWidth
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="0.00"
                slotProps={{
                  input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                  htmlInput: { step: '0.01', min: 0 }
                }} />
            </Grid>
          </Grid>

          <TextField label="Tags (comma-separated)" fullWidth value={tags}
                     onChange={e => setTags(e.target.value)} placeholder="design, urgent, q2" />
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
            <Button type="submit" variant="contained" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create project'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
