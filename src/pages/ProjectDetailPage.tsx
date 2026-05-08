import { useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, CheckCircle2, Circle, Star,
  UserPlus, X, FileText, PlayCircle, PauseCircle, Archive, Undo2,
} from 'lucide-react';
import {
  Box, Button, Card, Checkbox, Divider, FormControlLabel, Grid, IconButton,
  LinearProgress, MenuItem, Stack, Table, TableBody, TableRow, TableCell,
  TextField, Typography, Alert, Link as MuiLink,
} from '@mui/material';
import {
  useProject, useUpdateProject, useUpdateProjectStatus, useCancelProject,
  useAddMilestone, useUpdateMilestone, useDeleteMilestone,
  useAssignMember, useRemoveMember, useUsers, useGenerateProjectInvoice,
  useHandoffProject,
  useAddProjectCustomer, useSetPrimaryProjectCustomer, useRemoveProjectCustomer,
} from '@/api/hooks';
import { PageHeader, Modal, LoadingShell } from '@/components/ui/UI';
import { CustomerAutocompleteSelect } from '@/components/CustomerAutocompleteSelect';
import { ProjectStatusBadge } from './ProjectsPage';
import { formatCurrency, formatDate } from '@/utils/format';
import { useAuthStore } from '@/api/authStore';
import { can } from '@/utils/permissions';
import type { Customer, ProjectMilestone, ProjectStatus, ProjectCustomer } from '@/types';
import toast from 'react-hot-toast';
import { showError, humanizeError } from '@/utils/errors';
import { useAppConfirm } from '@/utils/confirm';
import { colors } from '@/theme';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: p, isLoading } = useProject(id);
  const { user } = useAuthStore();
  const confirm = useAppConfirm();

  const canAssign  = can.assignProjects(user);
  const canCancel  = can.cancelProjects(user);
  const canInvoice = can.createInvoices(user);
  const canEditDetails = can.editProjects(user);
  const canChangeStatus = canEditDetails;

  const updateStatus = useUpdateProjectStatus();
  const cancel = useCancelProject();

  const [editOpen, setEditOpen] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState<{ open: boolean; milestone?: ProjectMilestone }>({ open: false });
  const [assignOpen, setAssignOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [generateInvoiceOpen, setGenerateInvoiceOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  if (isLoading) return <LoadingShell />;
  if (!p) return (
    <Typography sx={{
      color: "text.secondary"
    }}>Project not found.</Typography>
  );

  const primaryCustomer = p.customers.find(c => c.isPrimary) ?? p.customers[0];

  const handleStatus = async (status: ProjectStatus) => {
    try {
      await updateStatus.mutateAsync({ id: p.id, status });
      toast.success(`Status: ${status}`);
    } catch (err) {
      showError(err, 'Failed to change status');
    }
  };

  return (
    <Box>
      <MuiLink component={Link} to="/projects" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2,
        fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace',
        textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary',
      }}>
        <ArrowLeft size={12} /> Projects
      </MuiLink>
      <PageHeader
        title={p.name}
        eyebrow={`${p.projectNumber} · ${primaryCustomer?.customerName ?? '—'}${p.customers.length > 1 ? ` +${p.customers.length - 1}` : ''}`}
        actions={(canEditDetails || canAssign || canInvoice) ? (
          <Stack
            direction="row"
            sx={{
              gap: 1,
              flexWrap: "wrap"
            }}>
            {canChangeStatus && p.status === 'Draft' && (
              <Button variant="outlined" startIcon={<PlayCircle size={14} strokeWidth={1.5} />}
                      onClick={() => handleStatus('Active')}>
                Activate
              </Button>
            )}
            {canChangeStatus && p.status === 'Active' && (
              <>
                <Button variant="text" startIcon={<PauseCircle size={14} strokeWidth={1.5} />}
                        onClick={() => handleStatus('OnHold')}>
                  Hold
                </Button>
                <Button variant="outlined" startIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                        onClick={() => handleStatus('Completed')}>
                  Complete
                </Button>
              </>
            )}
            {canChangeStatus && p.status === 'OnHold' && (
              <Button variant="outlined" startIcon={<PlayCircle size={14} strokeWidth={1.5} />}
                      onClick={() => handleStatus('Active')}>
                Resume
              </Button>
            )}
            {canChangeStatus && p.status === 'Completed' && (
              <Button variant="text" startIcon={<Undo2 size={14} strokeWidth={1.5} />}
                      onClick={() => handleStatus('Active')}>
                Re-open
              </Button>
            )}

            {canAssign && p.status !== 'Cancelled' && p.status !== 'Completed' && (
              <Button variant="text" startIcon={<UserPlus size={14} strokeWidth={1.5} />}
                      onClick={() => setHandoffOpen(true)}>
                Pass to…
              </Button>
            )}

            {canEditDetails && (
              <Button variant="text" startIcon={<Edit2 size={14} strokeWidth={1.5} />}
                      onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}

            {canInvoice && p.status !== 'Cancelled' && (
              <Button variant="contained" startIcon={<FileText size={14} strokeWidth={1.5} />}
                      onClick={() => setGenerateInvoiceOpen(true)}>
                Generate invoice
              </Button>
            )}
          </Stack>
        ) : undefined}
      >
        {p.description}
      </PageHeader>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Card>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                <Box>
                  <Typography variant="overline" sx={{
                    color: "text.secondary"
                  }}>Milestones</Typography>
                  <Typography variant="body2" sx={{ mt: 0.25 }}>
                    {p.milestones.filter(m => m.isCompleted).length} of {p.milestones.length} completed
                  </Typography>
                </Box>
                {canEditDetails && (
                  <Button size="small" variant="text" startIcon={<Plus size={12} />}
                          onClick={() => setMilestoneModal({ open: true })}>
                    Add milestone
                  </Button>
                )}
              </Stack>
              {p.milestones.length === 0 ? (
                <Box sx={{ px: 2.5, py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No milestones yet. Add one to track progress.</Typography>
                </Box>
              ) : (
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {p.milestones.map(m => (
                    <MilestoneRow key={m.id} projectId={p.id} milestone={m} canEdit={canEditDetails}
                      onEdit={() => setMilestoneModal({ open: true, milestone: m })} />
                  ))}
                </Box>
              )}
            </Card>

            <Card>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>Team</Typography>
                {canAssign && (
                  <Button size="small" variant="text" startIcon={<UserPlus size={12} />}
                          onClick={() => setAssignOpen(true)}>
                    Assign member
                  </Button>
                )}
              </Stack>
              {p.assignments.length === 0 ? (
                <Box sx={{ px: 2.5, py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No team members assigned</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableBody>
                    {p.assignments.map(a => (
                      <AssignmentRow key={a.id} projectId={p.id} assignment={a} canEdit={canAssign} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>

            {p.notes && (
              <Card sx={{ p: 2.5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    display: 'block',
                    mb: 1
                  }}>Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{p.notes}</Typography>
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
                  mb: 1
                }}>Status</Typography>
              <ProjectStatusBadge status={p.status} />

              <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    display: 'block',
                    mb: 0.75
                  }}>
                  Current holder
                </Typography>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1
                  }}>
                  <Typography variant="body2" noWrap>
                    {p.currentHolderUserName ?? (
                      <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Unassigned</Box>
                    )}
                  </Typography>
                  {canAssign && p.status !== 'Cancelled' && p.status !== 'Completed' && (
                    <Box component="button" type="button" onClick={() => setHandoffOpen(true)}
                         sx={{
                           background: 'none', border: 0, cursor: 'pointer',
                           fontFamily: '"JetBrains Mono", monospace',
                           fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                           color: colors.accent.dark,
                           whiteSpace: 'nowrap',
                           '&:hover': { textDecoration: 'underline' },
                         }}>
                      Pass to…
                    </Box>
                  )}
                </Stack>
              </Box>

              {canCancel && p.status !== 'Cancelled' && (
                <Button size="small" variant="text" color="error"
                        startIcon={<Archive size={12} />}
                        sx={{ mt: 1.5 }}
                        onClick={async () => {
                          if (await confirm({
                            kind: 'danger',
                            title: 'Cancel project',
                            message: `Cancel ${p.projectNumber} — ${p.name}? This is reversible by an Admin, but the project will move to Cancelled status and any open invoices will need to be handled separately.`,
                            confirmLabel: 'Cancel project',
                            cancelLabel: 'Keep open',
                          })) {
                            try {
                              await cancel.mutateAsync(p.id);
                              toast.success('Project cancelled');
                              navigate('/projects');
                            } catch (err) {
                              showError(err, 'Failed to cancel');
                            }
                          }
                        }}>
                  Cancel project
                </Button>
              )}
            </Card>

            <Card>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>
                  Customers ({p.customers.length})
                </Typography>
                {canAssign && (
                  <Button size="small" variant="text" startIcon={<Plus size={12} />}
                          onClick={() => setAddCustomerOpen(true)}>
                    Add
                  </Button>
                )}
              </Stack>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {p.customers.map(c => (
                  <ProjectCustomerRow key={c.customerId} projectId={p.id} customer={c}
                    canEdit={canAssign} canRemove={p.customers.length > 1} />
                ))}
              </Box>
            </Card>

            <Card sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                {p.templateName && <SidebarItem label="Template" value={p.templateName} />}
                <SidebarItem label="Start date" value={p.startDate ? formatDate(p.startDate) : '—'} />
                <SidebarItem label="End date" value={p.endDate ? formatDate(p.endDate) : '—'} />
                {p.completedAt && <SidebarItem label="Completed" value={formatDate(p.completedAt)} />}
                <SidebarItem label="Budget" value={p.budget ? formatCurrency(p.budget, p.currency) : '—'} mono />
                {p.tags && <SidebarItem label="Tags" value={p.tags} mono />}
              </Stack>
            </Card>

            <Card sx={{ p: 2.5 }}>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  display: 'block',
                  mb: 1.5
                }}>Financials</Typography>
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "baseline"
                  }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>Invoices</Typography>
                  <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.invoiceCount}</Typography>
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "baseline"
                  }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>Invoiced</Typography>
                  <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatCurrency(p.invoicedTotal, p.currency)}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "baseline"
                  }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>Collected</Typography>
                  <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace', color: colors.success }}>
                    {formatCurrency(p.paidTotal, p.currency)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "baseline"
                  }}>
                  <Typography variant="body2">Outstanding</Typography>
                  <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>
                    {formatCurrency(p.invoicedTotal - p.paidTotal, p.currency)}
                  </Typography>
                </Stack>
                {p.budget && (
                  <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: "text.secondary",
                        display: 'block',
                        mb: 0.5
                      }}>
                      vs Budget
                    </Typography>
                    <LinearProgress variant="determinate"
                      value={Math.min(100, (p.invoicedTotal / p.budget) * 100)}
                      sx={{
                        height: 6, borderRadius: 0,
                        bgcolor: colors.ink[100],
                        '& .MuiLinearProgress-bar': { bgcolor: colors.accent.main },
                      }} />
                    <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary', mt: 0.5, display: 'block' }}>
                      {((p.invoicedTotal / p.budget) * 100).toFixed(0)}% used
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {editOpen && <EditProjectModal project={p} onClose={() => setEditOpen(false)} />}
      {milestoneModal.open && (
        <MilestoneModal projectId={p.id} milestone={milestoneModal.milestone}
          onClose={() => setMilestoneModal({ open: false })} />
      )}
      {assignOpen && <AssignModal projectId={p.id} existing={p.assignments.map(a => a.userId)}
        onClose={() => setAssignOpen(false)} />}
      {handoffOpen && (
        <HandoffModal projectId={p.id}
          currentStatus={p.status}
          currentHolderId={p.currentHolderUserId ?? undefined}
          onClose={() => setHandoffOpen(false)} />
      )}
      {addCustomerOpen && (
        <AddProjectCustomerModal projectId={p.id}
          existingIds={p.customers.map(c => c.customerId)}
          onClose={() => setAddCustomerOpen(false)} />
      )}
      {generateInvoiceOpen && (
        <GenerateInvoiceModal projectId={p.id} taxRateDefault={0.14}
          customers={p.customers}
          onClose={() => setGenerateInvoiceOpen(false)} />
      )}
    </Box>
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

function MilestoneRow({ projectId, milestone, canEdit, onEdit }:
  { projectId: string; milestone: ProjectMilestone; canEdit: boolean; onEdit: () => void }) {
  const update = useUpdateMilestone();
  const del = useDeleteMilestone();
  const confirm = useAppConfirm();

  const toggleComplete = async () => {
    await update.mutateAsync({
      projectId, milestoneId: milestone.id,
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate,
      isCompleted: !milestone.isCompleted,
      sortOrder: milestone.sortOrder,
    });
  };

  return (
    <Box component="li" sx={{
      px: 2.5, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5,
      borderBottom: 1, borderColor: colors.ink[100],
      '&:last-of-type': { borderBottom: 0 },
    }}>
      <Box component="button" type="button" disabled={!canEdit}
        onClick={canEdit ? toggleComplete : undefined}
        sx={{
          mt: 0.25, background: 'none', border: 0, p: 0,
          cursor: canEdit ? 'pointer' : 'default',
          color: milestone.isCompleted ? colors.success : colors.ink[300],
          transition: 'transform 0.15s',
          '&:hover': canEdit ? { transform: 'scale(1.1)' } : {},
        }}>
        {milestone.isCompleted
          ? <CheckCircle2 size={18} strokeWidth={2} />
          : <Circle size={18} strokeWidth={1.5} />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontWeight: 500,
          textDecoration: milestone.isCompleted ? 'line-through' : 'none',
          color: milestone.isCompleted ? 'text.disabled' : 'text.primary',
        }}>
          {milestone.title}
        </Typography>
        {milestone.description && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              mt: 0.25,
              display: 'block'
            }}>
            {milestone.description}
          </Typography>
        )}
        {milestone.dueDate && (
          <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary', mt: 0.5, display: 'block' }}>
            Due {formatDate(milestone.dueDate)}
            {milestone.completedAt && ` · Completed ${formatDate(milestone.completedAt)}`}
          </Typography>
        )}
      </Box>
      {canEdit && (
        <Stack
          direction="row"
          sx={{
            gap: 0.5,
            flexShrink: 0
          }}>
          <IconButton size="small" onClick={onEdit}>
            <Edit2 size={13} strokeWidth={1.5} />
          </IconButton>
          <IconButton size="small" sx={{ '&:hover': { color: colors.danger } }}
            onClick={async () => {
              if (await confirm({
                kind: 'danger',
                title: 'Delete milestone',
                message: `Delete milestone "${milestone.title}"? This action cannot be undone.`,
                confirmLabel: 'Delete',
              })) {
                try {
                  await del.mutateAsync({ projectId, milestoneId: milestone.id });
                  toast.success('Milestone deleted');
                } catch (err) {
                  showError(err, 'Failed to delete milestone');
                }
              }
            }}>
            <Trash2 size={13} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      )}
    </Box>
  );
}

function AssignmentRow({ projectId, assignment, canEdit }:
  { projectId: string; assignment: { id: string; userId: string; userName: string; userEmail: string; role: string }; canEdit: boolean }) {
  const remove = useRemoveMember();
  const confirm = useAppConfirm();
  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 500 }}>{assignment.userName}</TableCell>
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{assignment.userEmail}</TableCell>
      <TableCell>
        <Box component="span" sx={{
          display: 'inline-block', px: 1, py: 0.25,
          fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
          bgcolor: 'rgba(197,165,114,0.1)', color: colors.accent.dark,
          border: '1px solid rgba(197,165,114,0.3)',
        }}>
          {assignment.role}
        </Box>
      </TableCell>
      <TableCell align="right">
        {canEdit && (
          <IconButton size="small" sx={{ '&:hover': { color: colors.danger } }}
            onClick={async () => {
              if (await confirm({
                kind: 'warning',
                title: 'Remove team member',
                message: `Remove ${assignment.userName} from this project? They'll lose access to project-specific actions but their past contributions remain in the audit trail.`,
                confirmLabel: 'Remove',
              })) {
                try {
                  await remove.mutateAsync({ projectId, userId: assignment.userId });
                  toast.success('Removed');
                } catch (err) {
                  showError(err, 'Failed to remove team member');
                }
              }
            }}>
            <X size={14} strokeWidth={1.5} />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}

function EditProjectModal({ project, onClose }:
  { project: { id: string; name: string; description?: string; startDate?: string; endDate?: string; budget?: number; currency: string; notes?: string; tags?: string }; onClose: () => void }) {
  const update = useUpdateProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [startDate, setStartDate] = useState(project.startDate?.slice(0, 10) || '');
  const [endDate, setEndDate] = useState(project.endDate?.slice(0, 10) || '');
  const [budget, setBudget] = useState(project.budget?.toString() || '');
  const [tags, setTags] = useState(project.tags || '');
  const [notes, setNotes] = useState(project.notes || '');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await update.mutateAsync({
        id: project.id, name,
        description: description || null,
        startDate: startDate || null, endDate: endDate || null,
        budget: budget ? Number(budget) : null,
        currency: project.currency, tags: tags || null, notes: notes || null,
      });
      toast.success('Project updated');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to update'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Edit project" maxWidth="md"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Project name" required fullWidth value={name} onChange={e => setName(e.target.value)} />
          <TextField label="Description" fullWidth multiline minRows={2}
                     value={description} onChange={e => setDescription(e.target.value)} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Start date" type="date" fullWidth value={startDate}
                         onChange={e => setStartDate(e.target.value)} slotProps={{
                inputLabel: { shrink: true }
              }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="End date" type="date" fullWidth value={endDate}
                         onChange={e => setEndDate(e.target.value)} slotProps={{
                inputLabel: { shrink: true }
              }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Budget"
                type="number"
                fullWidth
                value={budget}
                onChange={e => setBudget(e.target.value)}
                slotProps={{
                  input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                  htmlInput: { step: '0.01', min: 0 }
                }} />
            </Grid>
          </Grid>
          <TextField label="Tags" fullWidth value={tags} onChange={e => setTags(e.target.value)} />
          <TextField label="Notes" fullWidth multiline minRows={2}
                     value={notes} onChange={e => setNotes(e.target.value)} />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={update.isPending}>Save changes</Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function MilestoneModal({ projectId, milestone, onClose }:
  { projectId: string; milestone?: ProjectMilestone; onClose: () => void }) {
  const add = useAddMilestone();
  const update = useUpdateMilestone();
  const [title, setTitle] = useState(milestone?.title || '');
  const [description, setDescription] = useState(milestone?.description || '');
  const [dueDate, setDueDate] = useState(milestone?.dueDate?.slice(0, 10) || '');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (milestone) {
        await update.mutateAsync({
          projectId, milestoneId: milestone.id,
          title, description: description || null, dueDate: dueDate || null,
          isCompleted: milestone.isCompleted, sortOrder: milestone.sortOrder,
        });
        toast.success('Milestone updated');
      } else {
        await add.mutateAsync({
          projectId, title, description: description || null, dueDate: dueDate || null,
        });
        toast.success('Milestone added');
      }
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to save milestone'));
    }
  };

  return (
    <Modal open onClose={onClose} title={milestone ? 'Edit milestone' : 'New milestone'}
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Title" required fullWidth value={title}
                     onChange={e => setTitle(e.target.value)}
                     placeholder="e.g. Initial design approved" />
          <TextField label="Description" fullWidth multiline minRows={2}
                     value={description} onChange={e => setDescription(e.target.value)} />
          <TextField label="Due date" type="date" fullWidth value={dueDate}
                     onChange={e => setDueDate(e.target.value)} slotProps={{
            inputLabel: { shrink: true }
          }} />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">{milestone ? 'Save changes' : 'Add milestone'}</Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function AssignModal({ projectId, existing, onClose }:
  { projectId: string; existing: string[]; onClose: () => void }) {
  const { data: users } = useUsers({ activeOnly: true });
  const assign = useAssignMember();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Member');
  const [formError, setFormError] = useState<string | null>(null);

  const available = users?.filter(u => !existing.includes(u.id)) || [];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!userId) return;
    try {
      await assign.mutateAsync({ projectId, userId, role });
      toast.success('Member assigned');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to assign'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Assign team member"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField select label="User" required fullWidth value={userId}
                     onChange={e => setUserId(e.target.value)}
                     helperText={available.length === 0 ? 'All active users are already assigned to this project.' : ' '}>
            <MenuItem value="">Select a user…</MenuItem>
            {available.map(u => (
              <MenuItem key={u.id} value={u.id}>
                {u.fullName} — {u.email} ({u.role})
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Role on project" required fullWidth value={role}
                     onChange={e => setRole(e.target.value)}>
            <MenuItem value="Owner">Owner</MenuItem>
            <MenuItem value="Lead">Lead</MenuItem>
            <MenuItem value="Member">Member</MenuItem>
            <MenuItem value="Reviewer">Reviewer</MenuItem>
          </TextField>
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!userId || assign.isPending}>Assign</Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function GenerateInvoiceModal({ projectId, taxRateDefault, customers, onClose }:
  { projectId: string; taxRateDefault: number; customers: ProjectCustomer[]; onClose: () => void }) {
  const generate = useGenerateProjectInvoice();
  const navigate = useNavigate();
  const primary = customers.find(c => c.isPrimary) ?? customers[0];
  const [billCustomerId, setBillCustomerId] = useState(primary?.customerId ?? '');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState(taxRateDefault);
  const [discount, setDiscount] = useState(0);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const taxAmount = (subtotal - discount) * taxRate;
  const total = subtotal - discount + taxAmount;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (items.some(i => !i.description)) { setFormError('Fill in all line items'); return; }
    try {
      const inv = await generate.mutateAsync({
        projectId, dueDate, taxRate, discountAmount: discount,
        customerId: billCustomerId || null,
        reference: reference || null, notes: notes || null,
        overrideItems: items.map((it, idx) => ({ ...it, sortOrder: idx })),
      }) as { id: string };
      toast.success('Invoice generated');
      onClose();
      navigate(`/invoices/${inv.id}`);
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to generate invoice'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Generate invoice from project" maxWidth="lg"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <Alert severity="info" variant="outlined">
            The invoice will be linked to this project. If the project was created from a template,
            its default invoice items will be pre-loaded — you can override them below.
          </Alert>

          {customers.length > 1 && (
            <TextField select label="Bill to" required fullWidth value={billCustomerId}
                       onChange={e => setBillCustomerId(e.target.value)}
                       helperText={`This project has ${customers.length} owners. Select which one to bill on this invoice.`}>
              {customers.map(c => (
                <MenuItem key={c.customerId} value={c.customerId}>
                  {c.customerName} ({c.customerCode}){c.isPrimary ? ' — primary' : ''}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Due date" type="date" required fullWidth
                         value={dueDate} onChange={e => setDueDate(e.target.value)}
                         slotProps={{
                           inputLabel: { shrink: true }
                         }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Reference" fullWidth value={reference}
                         onChange={e => setReference(e.target.value)}
                         placeholder="Defaults to project number" />
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
              <Button size="small" variant="text"
                      onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])}>
                + Add line
              </Button>
            </Stack>
            <Box sx={{ border: 1, borderColor: 'divider' }}>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ bgcolor: colors.ink[50] }}>
                    <TableCell sx={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6875rem',
                      textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary',
                    }}>Description</TableCell>
                    <TableCell sx={{ width: 80, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Qty</TableCell>
                    <TableCell sx={{ width: 128, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Unit price</TableCell>
                    <TableCell sx={{ width: 128, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Total</TableCell>
                    <TableCell sx={{ width: 32 }} />
                  </TableRow>
                  {items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ p: 0.5 }}>
                        <TextField size="small" fullWidth value={it.description}
                                   onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                      </TableCell>
                      <TableCell sx={{ p: 0.5 }} align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={it.quantity}
                          onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))}
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
                          onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))}
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
                            <Trash2 size={12} strokeWidth={1.5} />
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
              <TextField label="Notes" fullWidth multiline minRows={2}
                         value={notes} onChange={e => setNotes(e.target.value)} />
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
                               onChange={e => setDiscount(Number(e.target.value))} sx={{ width: 96 }}
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
                               onChange={e => setTaxRate(Number(e.target.value))} sx={{ width: 96 }}
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
                      fontSize: '1rem'
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
            <Button type="submit" variant="contained" disabled={generate.isPending}>
              {generate.isPending ? 'Generating…' : 'Generate invoice'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function ProjectCustomerRow({ projectId, customer, canEdit, canRemove }:
  { projectId: string; customer: ProjectCustomer; canEdit: boolean; canRemove: boolean }) {
  const setPrimary = useSetPrimaryProjectCustomer();
  const remove = useRemoveProjectCustomer();
  const confirm = useAppConfirm();

  const handleSetPrimary = async () => {
    if (customer.isPrimary) return;
    try {
      await setPrimary.mutateAsync({ projectId, customerId: customer.customerId });
      toast.success(`${customer.customerName} is now the primary customer`);
    } catch (err) {
      showError(err, 'Failed to set primary');
    }
  };

  const handleRemove = async () => {
    if (!(await confirm({
      kind: 'warning',
      title: 'Remove customer',
      message: `Remove ${customer.customerName} as an owner of this project? Existing invoices linked to them are preserved.`,
      confirmLabel: 'Remove',
    }))) return;
    try {
      await remove.mutateAsync({ projectId, customerId: customer.customerId });
      toast.success('Customer removed');
    } catch (err) {
      showError(err, 'Failed to remove');
    }
  };

  return (
    <Box component="li" sx={{
      px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
      borderBottom: 1, borderColor: colors.ink[100],
      '&:last-of-type': { borderBottom: 0 },
    }}>
      {canEdit ? (
        <Box component="button" type="button"
          onClick={handleSetPrimary}
          disabled={customer.isPrimary || setPrimary.isPending}
          title={customer.isPrimary ? 'Primary customer' : 'Set as primary'}
          sx={{
            background: 'none', border: 0, p: 0,
            cursor: customer.isPrimary ? 'default' : 'pointer',
            color: customer.isPrimary ? colors.accent.main : colors.ink[300],
            transition: 'color 0.15s',
            flexShrink: 0,
            '&:hover': customer.isPrimary ? {} : { color: colors.accent.main },
          }}>
          <Star size={14} strokeWidth={1.5} fill={customer.isPrimary ? 'currentColor' : 'none'} />
        </Box>
      ) : (
        <Box sx={{ color: customer.isPrimary ? colors.accent.main : colors.ink[300], flexShrink: 0 }}>
          <Star size={14} strokeWidth={1.5} fill={customer.isPrimary ? 'currentColor' : 'none'} />
        </Box>
      )}
      <MuiLink component={Link} to={`/customers/${customer.customerId}`}
               underline="none" sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{
          fontWeight: 500
        }}>{customer.customerName}</Typography>
        <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
          {customer.customerCode}{customer.isPrimary ? ' · primary' : ''}
        </Typography>
      </MuiLink>
      {canEdit && canRemove && (
        <IconButton size="small" sx={{ '&:hover': { color: colors.danger } }}
          onClick={handleRemove} title="Remove from project">
          <X size={13} strokeWidth={1.5} />
        </IconButton>
      )}
    </Box>
  );
}

function AddProjectCustomerModal({ projectId, existingIds, onClose }:
  { projectId: string; existingIds: string[]; onClose: () => void }) {
  const add = useAddProjectCustomer();
  const [selected, setSelected] = useState<Customer | null>(null);
  const [makePrimary, setMakePrimary] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selected) { setFormError('Select a customer'); return; }
    try {
      await add.mutateAsync({ projectId, customerId: selected.id, makePrimary });
      toast.success('Customer added');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to add customer'));
    }
  };

  return (
    <Modal open onClose={onClose} title="Add customer to project"
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
              Customer *
            </Typography>
            <CustomerAutocompleteSelect
              mode="single" value={selected} onChange={setSelected}
              excludeIds={existingIds} autoFocus
            />
          </Box>
          <FormControlLabel
            control={<Checkbox checked={makePrimary} onChange={e => setMakePrimary(e.target.checked)} />}
            label={
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 0.5,
                  flexWrap: "wrap"
                }}>
                <span>Make this customer the primary owner</span>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>(demotes the current primary)</Typography>
              </Stack>
            }
          />
          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!selected || add.isPending}>
              Add customer
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function HandoffModal({ projectId, currentStatus, currentHolderId, onClose }:
  { projectId: string; currentStatus: ProjectStatus; currentHolderId?: string; onClose: () => void }) {
  const { data: users } = useUsers({ activeOnly: true });
  const handoff = useHandoffProject();
  const [toUserId, setToUserId] = useState(currentHolderId ?? '');
  const [newStatus, setNewStatus] = useState<ProjectStatus | ''>('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const sortedUsers = (users ?? [])
    .slice()
    .sort((a, b) => {
      const order: Record<string, number> = { Clerk: 0, Supervisor: 1, Manager: 2, Admin: 3, Viewer: 4 };
      const oa = order[a.role] ?? 99;
      const ob = order[b.role] ?? 99;
      if (oa !== ob) return oa - ob;
      return a.fullName.localeCompare(b.fullName);
    });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalizedToUserId = toUserId || null;
    const normalizedComment = comment.trim();
    const holderChanged = (normalizedToUserId ?? null) !== (currentHolderId ?? null);
    const statusChanged = !!newStatus;

    if (!holderChanged && !statusChanged && !normalizedComment) {
      setFormError('Pick a different user, change status, or add a comment.');
      return;
    }

    try {
      await handoff.mutateAsync({
        projectId,
        toUserId: normalizedToUserId,
        newStatus: newStatus || undefined,
        comment: normalizedComment || undefined,
      });
      toast.success('Project handed off');
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to hand off project'));
    }
  };

  const validStatusTargets: { value: ProjectStatus; label: string }[] = (() => {
    switch (currentStatus) {
      case 'Draft':     return [{ value: 'Active', label: 'Active' }];
      case 'Active':    return [
        { value: 'OnHold', label: 'On Hold' },
        { value: 'Completed', label: 'Completed' },
      ];
      case 'OnHold':    return [{ value: 'Active', label: 'Active (resume)' }];
      case 'Completed': return [{ value: 'Active', label: 'Active (re-open)' }];
      default:          return [];
    }
  })();

  return (
    <Modal open onClose={onClose} title="Pass project to another user" maxWidth="sm"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Alert severity="info" variant="outlined">
            Reassigning a project transfers ownership and records an entry in
            the project's status history. Anyone — including the original
            holder — can be selected.
          </Alert>

          <TextField select label="Pass to user" required fullWidth value={toUserId}
                     onChange={e => setToUserId(e.target.value)}>
            <MenuItem value="">Select a user…</MenuItem>
            {sortedUsers.map(u => (
              <MenuItem key={u.id} value={u.id}>
                {u.fullName} — {u.role}
                {u.id === currentHolderId ? ' (current holder)' : ''}
              </MenuItem>
            ))}
          </TextField>

          {validStatusTargets.length > 0 && (
            <TextField select label="Optionally change status" fullWidth value={newStatus}
                       onChange={e => setNewStatus(e.target.value as ProjectStatus | '')}>
              <MenuItem value="">Keep status as {currentStatus}</MenuItem>
              {validStatusTargets.map(s => (
                <MenuItem key={s.value} value={s.value}>Move to {s.label}</MenuItem>
              ))}
            </TextField>
          )}

          <TextField label="Note (optional)" fullWidth multiline minRows={3}
                     value={comment} onChange={e => setComment(e.target.value)}
                     placeholder="Why this handoff? Anything the next person should know?"
                     helperText="Saved to the project's status history." />

          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!toUserId || handoff.isPending}>
              {handoff.isPending ? 'Passing…' : 'Pass project'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
