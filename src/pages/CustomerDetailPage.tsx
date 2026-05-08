import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Card, Grid, Stack, Typography, Tabs, Tab, Table, TableHead, TableBody,
  TableRow, TableCell, Link as MuiLink,
} from '@mui/material';
import {
  ArrowLeft, Mail, Phone, MapPin, Hash, FileText, FolderKanban,
  TrendingUp, Wallet, AlertCircle,
} from 'lucide-react';
import { useCustomerSummary } from '@/api/hooks';
import { PageHeader, LoadingShell, StatusBadge, EmptyState } from '@/components/ui/UI';
import { ProjectStatusBadge } from './ProjectsPage';
import { formatCurrency, formatDate } from '@/utils/format';
import { colors } from '@/theme';

type TabKey = 'projects' | 'invoices';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useCustomerSummary(id);
  const [tab, setTab] = useState<TabKey>('projects');

  if (isLoading) return <LoadingShell />;
  if (!data) return (
    <Typography sx={{
      color: "text.secondary"
    }}>Customer not found.</Typography>
  );

  const { customer: c, projects, invoices, kpis } = data;

  return (
    <Box>
      <MuiLink component={Link} to="/customers" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5,
        fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'text.secondary', mb: 2,
        '&:hover': { color: 'text.primary' },
      }}>
        <ArrowLeft size={12} /> Customers
      </MuiLink>
      <PageHeader title={c.name} eyebrow={c.customerCode}>
        {!c.isActive && (
          <Box component="span" sx={{
            display: 'inline-block', mr: 1, px: 1, py: 0.25,
            fontSize: '0.6875rem', fontFamily: '"JetBrains Mono", monospace',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            bgcolor: colors.ink[100], color: colors.ink[500],
            border: '1px solid', borderColor: colors.ink[200],
          }}>
            Inactive
          </Box>
        )}
        Customer since {formatDate(c.createdAt)}
      </PageHeader>
      <Grid container spacing={2} sx={{
        mb: 3
      }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard label="Total invoiced" value={formatCurrency(kpis.totalInvoiced)} Icon={FileText} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard label="Total collected" value={formatCurrency(kpis.totalCollected)} Icon={TrendingUp} color={colors.success} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard label="Outstanding" value={formatCurrency(kpis.totalOutstanding)} Icon={AlertCircle}
                   color={kpis.totalOutstanding > 0 ? colors.warning : undefined} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard label="Projects" value={kpis.projectCount.toString()} Icon={FolderKanban} />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab value="projects" label={`Projects (${projects.length})`} />
              <Tab value="invoices" label={`Invoices (${invoices.length})`} />
            </Tabs>

            {tab === 'projects' ? (
              projects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="This customer doesn't have any projects. Create one from the Projects page."
                />
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell align="right">Budget</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map(p => (
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
                        <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {p.startDate ? formatDate(p.startDate) : '—'}
                          {p.endDate ? ` → ${formatDate(p.endDate)}` : ''}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {p.budget ? formatCurrency(p.budget, p.currency) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              invoices.length === 0 ? (
                <EmptyState title="No invoices yet" description="No invoices have been issued to this customer." />
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice</TableCell>
                      <TableCell>Issued</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <MuiLink component={Link} to={`/invoices/${i.id}`} sx={{
                            fontFamily: '"JetBrains Mono", monospace', fontSize: '0.875rem',
                          }}>
                            {i.invoiceNumber}
                          </MuiLink>
                          {i.projectId && (
                            <Box sx={{ fontSize: '0.625rem', fontFamily: '"JetBrains Mono", monospace', color: 'text.disabled', mt: 0.25 }}>
                              <MuiLink component={Link} to={`/projects/${i.projectId}`}>↳ Project</MuiLink>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {formatDate(i.issueDate)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {formatDate(i.dueDate)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {formatCurrency(i.total, i.currency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {i.balance > 0
                            ? <Box component="span" sx={{ color: colors.warning }}>{formatCurrency(i.balance, i.currency)}</Box>
                            : <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
                        </TableCell>
                        <TableCell><StatusBadge status={i.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </Card>
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
                }}>
                Contact
              </Typography>
              <Stack spacing={1.5}>
                {c.email && <SidebarRow Icon={Mail} value={c.email} href={`mailto:${c.email}`} />}
                {c.phone && <SidebarRow Icon={Phone} value={c.phone} href={`tel:${c.phone}`} />}
                {c.address && <SidebarRow Icon={MapPin} value={c.address} />}
                {c.taxId && <SidebarRow Icon={Hash} label="Tax ID" value={c.taxId} mono />}
                {c.idNumber && <SidebarRow Icon={Hash} label="ID Number" value={c.idNumber} mono />}
                {c.passportNumber && <SidebarRow Icon={Hash} label="Passport" value={c.passportNumber} mono />}
                {c.mmgWalletId && <SidebarRow Icon={Wallet} label="MMG Wallet" value={c.mmgWalletId} mono />}
                {!c.email && !c.phone && !c.address && !c.taxId && !c.idNumber && !c.passportNumber && !c.mmgWalletId && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                    No contact details on file
                  </Typography>
                )}
              </Stack>
            </Card>

            {c.notes && (
              <Card sx={{ p: 2.5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    display: 'block',
                    mb: 1
                  }}>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.notes}</Typography>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

function KpiCard({ label, value, Icon, color }:
  { label: string; value: string; Icon: typeof FileText; color?: string }) {
  return (
    <Card sx={{ p: 2 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1
        }}>
        <Typography variant="overline" sx={{
          color: "text.secondary"
        }}>{label}</Typography>
        <Box sx={{ color: 'text.disabled' }}>
          <Icon size={14} strokeWidth={1.5} />
        </Box>
      </Stack>
      <Typography sx={{
        fontFamily: '"Fraunces", serif',
        fontSize: '1.5rem',
        fontWeight: 400,
        color: color || 'text.primary',
      }}>
        {value}
      </Typography>
    </Card>
  );
}

function SidebarRow({ Icon, label, value, mono, href }:
  { Icon: typeof Mail; label?: string; value: string; mono?: boolean; href?: string }) {
  const content = (
    <Typography sx={{
      fontFamily: mono ? '"JetBrains Mono", monospace' : undefined,
      fontSize: mono ? '0.75rem' : '0.875rem',
      wordBreak: 'break-word',
    }}>
      {value}
    </Typography>
  );
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "flex-start",
        gap: 1
      }}>
      <Box sx={{ color: 'text.disabled', mt: 0.5, flexShrink: 0 }}>
        <Icon size={13} strokeWidth={1.5} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {label && (
          <Typography variant="overline" sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>
            {label}
          </Typography>
        )}
        {href ? <MuiLink href={href} underline="hover">{content}</MuiLink> : content}
      </Box>
    </Stack>
  );
}
