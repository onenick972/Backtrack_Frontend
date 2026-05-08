import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

// ───────────────────────────────────────────────────────────────────────
// Public types — kept identical to the previous material-ui-confirm
// wrapper so call sites (useAppConfirm) don't need to change.
// ───────────────────────────────────────────────────────────────────────

export type ConfirmKind = 'danger' | 'warning' | 'info';

export interface AppConfirmOptions {
  title: string;
  message: string;
  kind?: ConfirmKind;
  confirmLabel?: string;
  cancelLabel?: string;
}

// ───────────────────────────────────────────────────────────────────────
// Context — exposes a single function that opens the dialog and returns
// a promise resolving to the user's choice.
// ───────────────────────────────────────────────────────────────────────

type ConfirmFn = (opts: AppConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface DialogState {
  open: boolean;
  opts: AppConfirmOptions;
}

const DEFAULT_LABEL: Record<ConfirmKind, string> = {
  danger: 'Delete',
  warning: 'Confirm',
  info: 'OK',
};

const BUTTON_COLOR: Record<ConfirmKind, 'error' | 'warning' | 'primary'> = {
  danger: 'error',
  warning: 'warning',
  info: 'primary',
};

// ───────────────────────────────────────────────────────────────────────
// Provider — mounts a single shared <Dialog> and exposes the imperative
// confirm() function via context. Inherits all theme overrides for
// MuiDialog/MuiDialogTitle/etc, so it visually matches every other modal.
// ───────────────────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    open: false,
    opts: { title: '', message: '' },
  });

  // Resolver for the in-flight promise. We keep it in a ref so closing
  // the dialog can settle the promise without triggering a re-render.
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, opts });
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false }));
    // Resolve after scheduling the close so the dialog starts animating
    // away before the caller proceeds with whatever follows the await.
    resolver?.(result);
  }, []);

  const handleClose = useCallback(
    (_event: object, _reason: 'backdropClick' | 'escapeKeyDown') => {
      // Both backdrop click and Escape cancel — matching the old
      // material-ui-confirm defaults.
      settle(false);
    },
    [settle],
  );

  const { open, opts } = state;
  const kind = opts.kind ?? 'warning';
  const confirmLabel = opts.confirmLabel ?? DEFAULT_LABEL[kind];
  const cancelLabel = opts.cancelLabel ?? 'Cancel';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        aria-labelledby="app-confirm-title"
        aria-describedby="app-confirm-description"
      >
        <DialogTitle id="app-confirm-title">{opts.title}</DialogTitle>
        <DialogContent>
          <DialogContentText
            id="app-confirm-description"
            // Preserve newlines in messages — pages occasionally pass
            // multi-line explanations and the old library rendered them
            // faithfully.
            sx={{ whiteSpace: 'pre-line' }}
          >
            {opts.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => settle(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={BUTTON_COLOR[kind]}
            autoFocus
            onClick={() => settle(true)}
          >
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Hook — same shape as the previous useAppConfirm, so no call site
// changes. Returns a stable confirm() function (memoized in the
// provider) that resolves to true/false.
//
// Usage inside a component:
//   const confirm = useAppConfirm();
//   if (await confirm({ title: 'Delete?', message: '…', kind: 'danger' })) {
//     await mutation.mutateAsync(...);
//   }
// ───────────────────────────────────────────────────────────────────────

export function useAppConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useAppConfirm must be used within <ConfirmProvider>');
  }
  // Wrap once so callers always get a stable reference even if context
  // is updated in the future. Cheap useMemo with a single dep.
  return useMemo(() => ctx, [ctx]);
}
