import { useState, type FormEvent } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Box, Button, Card, IconButton, Stack, Table, TableHead, TableBody, TableRow,
  TableCell, Typography, TextField, FormControlLabel, Checkbox, Grid, Divider,
} from '@mui/material';
import {
  useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
} from '@/api/hooks';
import { PageHeader, Modal, EmptyState, LoadingShell } from '@/components/ui/UI';
import { formatCurrency } from '@/utils/format';
import { can } from '@/utils/permissions';
import { useAuthStore } from '@/api/authStore';
import type { ProjectTemplate, TemplateMilestone, TemplateItem } from '@/types';
import toast from 'react-hot-toast';
import { humanizeError, showError } from '@/utils/errors';
import { useAppConfirm } from '@/utils/confirm';
import { colors } from '@/theme';

export default function TemplatesPage() {
  const { user } = useAuthStore();
  const canEdit = can.manageTemplates(user);
  const isAdmin = can.deleteTemplates(user);
  const confirm = useAppConfirm();

  const [showInactive, setShowInactive] = useState(false);
  const { data, isLoading } = useTemplates(!showInactive);
  const del = useDeleteTemplate();

  const [editor, setEditor] = useState<{ open: boolean; template?: ProjectTemplate }>({ open: false });

  return (
    <Box>
      <PageHeader
        title="Project Templates"
        eyebrow="Reusable Workflows"
        actions={canEdit ? (
          <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setEditor({ open: true })}>
            New template
          </Button>
        ) : undefined}
      >
        Define standard project structures with default milestones and invoice items. Apply them when creating new projects to save time.
      </PageHeader>
      <Card sx={{ mb: 2 }}>
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
            {data?.length || 0} {showInactive ? 'total' : 'active'} template{data?.length === 1 ? '' : 's'}
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />}
            label={<Typography variant="overline" sx={{
              color: "text.secondary"
            }}>Show inactive</Typography>}
          />
        </Stack>

        {isLoading ? (
          <Box sx={{
            p: 2
          }}><LoadingShell /></Box>
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No templates yet"
            description="Templates define standard project structures with milestones and invoice items. Create your first one to speed up project creation."
            action={canEdit ? (
              <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => setEditor({ open: true })}>
                Create template
              </Button>
            ) : undefined}
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Default budget</TableCell>
                <TableCell align="center">Duration</TableCell>
                <TableCell align="center">Milestones</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(t => (
                <TableRow key={t.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 400 }}>
                    <Typography variant="body2" noWrap>{t.description || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {t.defaultBudget ? formatCurrency(t.defaultBudget) : '—'}
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {t.defaultDurationDays ? `${t.defaultDurationDays}d` : '—'}
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.milestones.length}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.invoiceItems.length}</TableCell>
                  <TableCell>{t.isActive ? <ActiveBadge /> : <InactiveBadge />}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "flex-end",
                        gap: 0.5
                      }}>
                      {canEdit && (
                        <IconButton size="small" onClick={() => setEditor({ open: true, template: t })}>
                          <Edit2 size={14} strokeWidth={1.5} />
                        </IconButton>
                      )}
                      {isAdmin && (
                        <IconButton size="small" sx={{ '&:hover': { color: colors.danger, bgcolor: '#fff1f2' } }}
                          onClick={async () => {
                            if (await confirm({
                              kind: 'danger',
                              title: 'Delete template',
                              message: `Delete template "${t.name}"? If any project was created from this template, the template will be deactivated instead — existing projects will keep their copy of the milestones and items.`,
                              confirmLabel: 'Delete',
                            })) {
                              try {
                                await del.mutateAsync(t.id);
                                toast.success('Template removed');
                              } catch (err) {
                                showError(err, 'Failed to delete template');
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
      {editor.open && (
        <TemplateEditor template={editor.template} onClose={() => setEditor({ open: false })} />
      )}
    </Box>
  );
}

function TemplateEditor({ template, onClose }: { template?: ProjectTemplate; onClose: () => void }) {
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const isEdit = !!template;

  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [defaultBudget, setDefaultBudget] = useState(template?.defaultBudget?.toString() || '');
  const [defaultDuration, setDefaultDuration] = useState(template?.defaultDurationDays?.toString() || '');
  const [defaultTaxRate, setDefaultTaxRate] = useState(template?.defaultTaxRate ?? 0.14);
  const [milestones, setMilestones] = useState<TemplateMilestone[]>(template?.milestones || []);
  const [items, setItems] = useState<TemplateItem[]>(template?.invoiceItems || []);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const body = {
      name, description: description || null,
      defaultBudget: defaultBudget ? Number(defaultBudget) : null,
      defaultDurationDays: defaultDuration ? Number(defaultDuration) : null,
      defaultTaxRate,
      milestones: milestones.map((m, i) => ({ ...m, sortOrder: i })),
      invoiceItems: items.map((it, i) => ({ ...it, sortOrder: i })),
    };
    try {
      if (isEdit && template) {
        await update.mutateAsync({ id: template.id, ...body, isActive });
        toast.success('Template updated');
      } else {
        await create.mutateAsync(body);
        toast.success('Template created');
      }
      onClose();
    } catch (err) {
      setFormError(humanizeError(err, 'Failed to save template'));
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit template' : 'New template'} maxWidth="lg"
           error={formError} onDismissError={() => setFormError(null)}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <TextField label="Template name" required fullWidth value={name}
                     onChange={e => setName(e.target.value)}
                     placeholder="e.g. Standard Web Development Package" />
          <TextField label="Description" fullWidth multiline minRows={2}
                     value={description} onChange={e => setDescription(e.target.value)} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Default budget"
                type="number"
                fullWidth
                value={defaultBudget}
                onChange={e => setDefaultBudget(e.target.value)}
                slotProps={{
                  input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                  htmlInput: { step: '0.01', min: 0 }
                }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Duration (days)"
                type="number"
                fullWidth
                value={defaultDuration}
                onChange={e => setDefaultDuration(e.target.value)}
                slotProps={{
                  input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                  htmlInput: { min: 1 }
                }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Default tax rate"
                type="number"
                fullWidth
                value={defaultTaxRate}
                onChange={e => setDefaultTaxRate(Number(e.target.value))}
                slotProps={{
                  input: { sx: { fontFamily: '"JetBrains Mono", monospace' } },
                  htmlInput: { step: '0.001', min: 0, max: 1 }
                }} />
            </Grid>
          </Grid>

          {isEdit && (
            <FormControlLabel
              control={<Checkbox checked={isActive} onChange={e => setIsActive(e.target.checked)} />}
              label="Active (available when creating projects)"
            />
          )}

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
              }}>Default milestones</Typography>
              <Button size="small" variant="text"
                      onClick={() => setMilestones([...milestones, { title: '', sortOrder: milestones.length }])}>
                + Add milestone
              </Button>
            </Stack>
            {milestones.length === 0 ? (
              <Box sx={{ p: 1.5, border: '1px dashed', borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem', fontStyle: 'italic' }}>
                No milestones yet. Milestones get auto-created on projects using this template.
              </Box>
            ) : (
              <Box sx={{ border: 1, borderColor: 'divider' }}>
                {milestones.map((m, idx) => (
                  <Grid container spacing={1} key={idx} sx={{ p: 1, borderBottom: idx < milestones.length - 1 ? 1 : 0, borderColor: colors.ink[100] }}>
                    <Grid size={5}>
                      <TextField size="small" fullWidth placeholder="Milestone title" value={m.title}
                                 onChange={e => setMilestones(milestones.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                    </Grid>
                    <Grid size={4}>
                      <TextField size="small" fullWidth placeholder="Description (optional)" value={m.description || ''}
                                 onChange={e => setMilestones(milestones.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    </Grid>
                    <Grid size={2}>
                      <TextField size="small" fullWidth type="number" placeholder="Day +"
                                 value={m.offsetDays ?? ''}
                                 onChange={e => setMilestones(milestones.map((x, i) => i === idx ? { ...x, offsetDays: e.target.value ? Number(e.target.value) : undefined } : x))}
                                 slotProps={{
                                   htmlInput: { min: 0 }
                                 }} />
                    </Grid>
                    <Grid size={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                                  sx={{ '&:hover': { color: colors.danger } }}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Box>
            )}
          </Box>

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
              }}>Default invoice items</Typography>
              <Button size="small" variant="text"
                      onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, sortOrder: items.length }])}>
                + Add line
              </Button>
            </Stack>
            {items.length === 0 ? (
              <Box sx={{ p: 1.5, border: '1px dashed', borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem', fontStyle: 'italic' }}>
                No default items. These will pre-fill when generating an invoice from a project using this template.
              </Box>
            ) : (
              <Box sx={{ border: 1, borderColor: 'divider' }}>
                {items.map((it, idx) => (
                  <Grid container spacing={1} key={idx} sx={{ p: 1, borderBottom: idx < items.length - 1 ? 1 : 0, borderColor: colors.ink[100] }}>
                    <Grid size={6}>
                      <TextField size="small" fullWidth placeholder="Item description" value={it.description}
                                 onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    </Grid>
                    <Grid size={2}>
                      <TextField size="small" fullWidth type="number" placeholder="Qty"
                                 value={it.quantity}
                                 onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))}
                                 slotProps={{
                                   htmlInput: { step: 'any', min: 0 }
                                 }} />
                    </Grid>
                    <Grid size={3}>
                      <TextField size="small" fullWidth type="number" placeholder="Unit price"
                                 value={it.unitPrice}
                                 onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))}
                                 slotProps={{
                                   htmlInput: { step: '0.01', min: 0 }
                                 }} />
                    </Grid>
                    <Grid size={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                  sx={{ '&:hover': { color: colors.danger } }}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Box>
            )}
          </Box>

          <Divider />
          <Stack
            direction="row"
            sx={{
              justifyContent: "flex-end",
              gap: 1
            }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Save changes' : 'Create template'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function ActiveBadge() {
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0',
    }}>Active</Box>
  );
}
function InactiveBadge() {
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: 1, py: 0.25,
      fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
      bgcolor: colors.ink[100], color: colors.ink[500], border: '1px solid', borderColor: colors.ink[200],
    }}>Inactive</Box>
  );
}
