import { useDashboardKpis } from '@/api/hooks';
import { PageHeader } from '@/components/ui/UI';
import { formatCurrency, formatNumber } from '@/utils/format';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, AlertTriangle, Users, FileText } from 'lucide-react';
import { Box, Card, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '@/theme';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardKpis();

  if (isLoading || !data) {
    return (
      <Box>
        <PageHeader title="Overview" eyebrow="Dashboard / KPIs">
          Financial pulse across customers, invoices, and collections.
        </PageHeader>
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={128} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Overview" eyebrow="Dashboard / KPIs">
        Financial pulse across customers, invoices, and collections.
      </PageHeader>
      <Grid container spacing={2} sx={{
        mb: 4
      }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Kpi
            label="Outstanding"
            value={formatCurrency(data.totalOutstanding)}
            hint="Across all unpaid invoices"
            icon={<FileText size={16} strokeWidth={1.5} />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Kpi
            label="Collected this month"
            value={formatCurrency(data.collectedThisMonth)}
            hint={`${data.invoicesThisMonth} invoices issued`}
            icon={<TrendingUp size={16} strokeWidth={1.5} />}
            accent
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Kpi
            label="Overdue"
            value={formatCurrency(data.overdueAmount)}
            hint={`${data.overdueInvoices} invoices past due`}
            icon={<AlertTriangle size={16} strokeWidth={1.5} />}
            danger
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Kpi
            label="Active customers"
            value={formatNumber(data.activeCustomers)}
            hint="Currently billable"
            icon={<Users size={16} strokeWidth={1.5} />}
          />
        </Grid>
      </Grid>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "baseline",
              justifyContent: "space-between",
              mb: 3
            }}>
            <Box>
              <Typography variant="overline" component="div" sx={{
                color: "text.secondary"
              }}>
                Trailing 12 months
              </Typography>
              <Typography variant="h3">Invoiced vs Collected</Typography>
            </Box>
          </Stack>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.last12Months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dcdce0" vertical={false} />
              <XAxis dataKey="month" stroke="#8a8a96" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="#8a8a96" fontSize={11} fontFamily="JetBrains Mono"
                     tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0a0a0b', border: 'none', color: '#f1f1f3', fontSize: '12px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="invoiced" name="Invoiced" fill="#2a2a31" />
              <Bar dataKey="collected" name="Collected" fill="#c5a572" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="overline" component="div" sx={{
            color: "text.secondary"
          }}>
            Distribution
          </Typography>
          <Typography variant="h3" sx={{ mb: 3 }}>Invoices by status</Typography>
          <Grid container spacing={2}>
            {data.invoicesByStatus.map(s => (
              <Grid size={{ xs: 6, md: 4, lg: 2 }} key={s.status}>
                <Box sx={{ borderLeft: `2px solid ${colors.accent.main}`, pl: 1.5, py: 0.5 }}>
                  <Typography variant="overline" sx={{
                    color: "text.secondary"
                  }}>{s.status}</Typography>
                  <Typography variant="h3" sx={{ mt: 0.5 }}>{s.count}</Typography>
                  <Typography variant="caption" sx={{
                    color: "text.secondary"
                  }}>{formatCurrency(s.amount)}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

function Kpi({ label, value, hint, icon, accent, danger }:
  { label: string; value: string; hint?: string; icon: ReactNode; accent?: boolean; danger?: boolean }) {
  const stripeColor = danger ? colors.danger : accent ? colors.accent.main : 'transparent';
  return (
    <Card sx={{
      p: 2.5,
      borderLeft: `2px solid ${stripeColor}`,
      height: '100%',
    }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5
        }}>
        <Typography variant="overline" sx={{
          color: "text.secondary"
        }}>{label}</Typography>
        <Box sx={{ color: 'text.disabled' }}>{icon}</Box>
      </Stack>
      <Typography sx={{
        fontFamily: '"Fraunces", serif',
        fontSize: '1.875rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.1,
      }}>
        {value}
      </Typography>
      {hint && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            mt: 1,
            display: 'block'
          }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}
