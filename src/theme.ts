import { createTheme } from '@mui/material/styles';
import { alertClasses } from '@mui/material/Alert';

// BackPocket palette — preserved from the original Tailwind config
const ink = {
  950: '#0a0a0b',
  900: '#111114',
  800: '#1a1a1f',
  700: '#2a2a31',
  600: '#3a3a44',
  500: '#5a5a66',
  400: '#8a8a96',
  300: '#b8b8c0',
  200: '#dcdce0',
  100: '#f1f1f3',
  50:  '#f9f9fa',
};

const accent = {
  main:  '#c5a572',  // muted gold
  dark:  '#a08755',
  light: '#e3cfa3',
};

export const colors = {
  ink,
  accent,
  success: '#3d8b6e',
  warning: '#c08a3d',
  danger:  '#b04a47',
  // status background tints
  statusBg: {
    blue:  '#eff6ff',  blueText:  '#1e40af',  blueBorder:  '#bfdbfe',
    amber: '#fffbeb',  amberText: '#92400e',  amberBorder: '#fde68a',
    green: '#ecfdf5',  greenText: '#065f46',  greenBorder: '#a7f3d0',
    rose:  '#fff1f2',  roseText:  '#9f1239',  roseBorder:  '#fecdd3',
    grey:  ink[100],   greyText:  ink[500],   greyBorder:  ink[200],
  },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: ink[900],
      light: ink[700],
      dark: ink[950],
      contrastText: '#ffffff',
    },
    secondary: {
      main: accent.main,
      dark: accent.dark,
      light: accent.light,
      contrastText: ink[950],
    },
    error:   { main: '#b04a47', light: '#fff1f2', dark: '#9f1239' },
    warning: { main: '#c08a3d', light: '#fffbeb', dark: '#92400e' },
    info:    { main: '#1e40af', light: '#eff6ff', dark: '#1e3a8a' },
    success: { main: '#3d8b6e', light: '#ecfdf5', dark: '#065f46' },
    background: {
      default: '#f9f9fa',
      paper:   '#ffffff',
    },
    text: {
      primary:   ink[900],
      secondary: ink[600],
      disabled:  ink[400],
    },
    divider: ink[200],
    grey: {
      50:  ink[50],
      100: ink[100],
      200: ink[200],
      300: ink[300],
      400: ink[400],
      500: ink[500],
      600: ink[600],
      700: ink[700],
      800: ink[800],
      900: ink[900],
    },
  },

  // Square corners across the system — BackPocket aesthetic
  shape: {
    borderRadius: 0,
  },

  // Typography: Fraunces for display/headlines, Geist for body, JetBrains Mono for codes
  typography: {
    fontFamily: '"Geist", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: 600,
      fontSize: '1.875rem',
      letterSpacing: '-0.015em',
      lineHeight: 1.15,
    },
    h3: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.25,
    },
    h5: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500 },
    body1: { fontSize: '0.875rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: {
      fontWeight: 500,
      letterSpacing: 0,
      textTransform: 'none',
    },
    caption: { fontSize: '0.75rem' },
    overline: {
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: '0.6875rem',
      fontWeight: 500,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      lineHeight: 1.6,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f9f9fa',
          // Subtle paper grain
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(10,10,11,0.025) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: ink[200],
          color: ink[900],
          '&:hover': { borderColor: ink[400], backgroundColor: ink[50] },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          '& fieldset': { borderColor: ink[200] },
          '&:hover fieldset': { borderColor: ink[400] },
          '&.Mui-focused fieldset': { borderColor: ink[900], borderWidth: 1 },
          backgroundColor: '#ffffff',
        },
        input: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          color: ink[600],
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { fontSize: '0.75rem' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 0, fontWeight: 500 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${ink[200]}`,
          borderRadius: 0,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 0 },
        outlined: { borderColor: ink[200] },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: '0 12px 40px -12px rgba(10, 10, 11, 0.18), 0 4px 12px -4px rgba(10, 10, 11, 0.08)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Fraunces", ui-serif, Georgia, serif',
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '16px 24px 12px',
          borderBottom: `1px solid ${ink[200]}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        // MUI applies `padding-top: 0` whenever DialogContent immediately
        // follows a DialogTitle (so the content can sit flush in
        // titleless variants). With our bordered title we want breathing
        // room, so force the top padding back on with `&&` to outweigh
        // the built-in adjacent-sibling rule.
        root: {
          padding: '20px 24px',
          '&&': { paddingTop: 20 },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px',
          borderTop: `1px solid ${ink[200]}`,
          backgroundColor: ink[50],
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: ink[50],
          '& .MuiTableCell-root': {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: ink[500],
            borderBottomColor: ink[200],
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: ink[100],
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(241,241,243,0.5)' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${ink[200]}`,
          minHeight: 40,
        },
        indicator: {
          backgroundColor: accent.main,
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          padding: '8px 16px',
          fontSize: '0.8125rem',
          fontWeight: 500,
          textTransform: 'none',
          letterSpacing: 0,
          color: ink[500],
          '&.Mui-selected': { color: ink[900] },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: ink[900],
          fontSize: '0.75rem',
          borderRadius: 0,
          padding: '6px 10px',
        },
        arrow: { color: ink[900] },
      },
    },
    MuiAlert: {
      styleOverrides: {
        // v9: per-variant slot keys (outlinedError, outlinedWarning, …) were
        // removed. Combine the variant + color classes inside `root` instead.
        // See: https://mui.com/material-ui/migration/upgrade-to-v9/#alert
        root: {
          borderRadius: 0,
          fontSize: '0.875rem',
          [`&.${alertClasses.outlined}.${alertClasses.colorError}`]: {
            backgroundColor: '#fff1f2', color: '#9f1239', borderColor: '#fecdd3',
          },
          [`&.${alertClasses.outlined}.${alertClasses.colorWarning}`]: {
            backgroundColor: '#fffbeb', color: '#92400e', borderColor: '#fde68a',
          },
          [`&.${alertClasses.outlined}.${alertClasses.colorInfo}`]: {
            backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe',
          },
          [`&.${alertClasses.outlined}.${alertClasses.colorSuccess}`]: {
            backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0',
          },
        },
      },
    },
    MuiCheckbox: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { padding: 4 } },
    },
    MuiRadio: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { padding: 4 } },
    },
    MuiSwitch: {
      defaultProps: { size: 'small' },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: {
          color: ink[900],
          fontWeight: 500,
          textDecorationColor: ink[300],
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: ink[200] },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: 6,
          '&:hover': { backgroundColor: ink[100] },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${ink[200]}`,
          borderRadius: 0,
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          minHeight: 36,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          border: `1px solid ${ink[200]}`,
          borderRadius: 0,
          boxShadow: '0 12px 40px -12px rgba(10, 10, 11, 0.18)',
        },
        option: {
          fontSize: '0.875rem',
        },
      },
    },
  },
});

export default theme;
