import { type ReactNode } from 'react';
import {
  Box, Stack, Typography, Skeleton, Alert, IconButton, Dialog,
  DialogTitle, DialogContent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { InvoiceStatus, PaymentStatus } from '@/types';
import { colors } from '@/theme';

export function StatusBadge({ status }: { status: InvoiceStatus | PaymentStatus | string }) {
  const sb = colors.statusBg;
  const variants: Record<string, { bg: string; text: string; border: string; line?: boolean }> = {
    Draft:         { bg: sb.grey,  text: sb.greyText,  border: sb.greyBorder },
    Sent:          { bg: sb.blue,  text: sb.blueText,  border: sb.blueBorder },
    PartiallyPaid: { bg: sb.amber, text: sb.amberText, border: sb.amberBorder },
    Paid:          { bg: sb.green, text: sb.greenText, border: sb.greenBorder },
    Overdue:       { bg: sb.rose,  text: sb.roseText,  border: sb.roseBorder },
    Cancelled:     { bg: sb.grey,  text: sb.greyText,  border: sb.greyBorder, line: true },
    Pending:       { bg: sb.amber, text: sb.amberText, border: sb.amberBorder },
    Completed:     { bg: sb.green, text: sb.greenText, border: sb.greenBorder },
    Failed:        { bg: sb.rose,  text: sb.roseText,  border: sb.roseBorder },
    Refunded:      { bg: sb.grey,  text: sb.greyText,  border: sb.greyBorder },
  };
  const v = variants[status] ?? { bg: sb.grey, text: sb.greyText, border: sb.greyBorder };
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.25,
        fontSize: '0.6875rem',
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        bgcolor: v.bg,
        color: v.text,
        border: '1px solid',
        borderColor: v.border,
        textDecoration: v.line ? 'line-through' : 'none',
      }}
    >
      {status}
    </Box>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Stack
      spacing={1}
      sx={{
        alignItems: "center",
        textAlign: "center",
        py: 8,
        px: 3
      }}>
      <Typography variant="h3" sx={{
        color: "text.secondary"
      }}>{title}</Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            maxWidth: 480
          }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{
        mt: 3
      }}>{action}</Box>}
    </Stack>
  );
}

export function PageHeader({ title, eyebrow, actions, children }:
  { title: string; eyebrow?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 3,
        mb: 4,
        pb: 3,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
      <Box>
        {eyebrow && (
          <Typography
            variant="overline"
            component="div"
            sx={{
              color: "text.secondary",
              mb: 1
            }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h1" component="h1">{title}</Typography>
        {children && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 1.5,
              maxWidth: 640
            }}>
            {children}
          </Typography>
        )}
      </Box>
      {actions && <Stack
        direction="row"
        sx={{
          gap: 1,
          flexShrink: 0
        }}>{actions}</Stack>}
    </Stack>
  );
}

/**
 * Themed wrapper around MUI Dialog that preserves the original Modal API,
 * including the in-modal error banner that pages set via setFormError.
 */
export function Modal({
  open, onClose, title, children, maxWidth = 'sm', error, onDismissError,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Accepts MUI breakpoint strings ('xs' | 'sm' | 'md' | 'lg' | 'xl') or legacy 'max-w-*' Tailwind strings */
  maxWidth?: string;
  error?: string | null;
  onDismissError?: () => void;
}) {
  // Translate legacy Tailwind max-width values to MUI breakpoints
  const muiMaxWidth = legacyToMuiMaxWidth(maxWidth);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={muiMaxWidth}
      fullWidth
      slotProps={{ paper: { sx: { maxHeight: '90vh' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {error && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert
            severity="error"
            variant="outlined"
            onClose={onDismissError}
            sx={{ whiteSpace: 'pre-line' }}
          >
            {error}
          </Alert>
        </Box>
      )}

      <DialogContent dividers={false}>{children}</DialogContent>
    </Dialog>
  );
}

function legacyToMuiMaxWidth(v: string): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false {
  // New-style: MUI breakpoint passed directly
  if (['xs', 'sm', 'md', 'lg', 'xl'].includes(v)) return v as 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  // Legacy Tailwind max-w-* strings — map to nearest MUI breakpoint
  const map: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
    'max-w-sm': 'xs',
    'max-w-md': 'xs',
    'max-w-lg': 'sm',
    'max-w-xl': 'sm',
    'max-w-2xl': 'md',
    'max-w-3xl': 'lg',
    'max-w-4xl': 'lg',
    'max-w-5xl': 'xl',
  };
  return map[v] ?? 'sm';
}

export function LoadingShell() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rectangular" height={48} />
      <Skeleton variant="rectangular" height={48} />
      <Skeleton variant="rectangular" height={48} />
    </Stack>
  );
}
