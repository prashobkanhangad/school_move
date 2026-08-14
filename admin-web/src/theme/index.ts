import { createTheme } from '@mui/material/styles';

const border = 'rgba(15, 23, 42, 0.08)';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0F766E', light: '#14B8A6', dark: '#115E59', contrastText: '#FFFFFF' },
    secondary: { main: '#0369A1' },
    success: { main: '#15803D' },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    info: { main: '#0284C7' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    divider: border,
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    action: {
      hover: 'rgba(15, 23, 42, 0.03)',
      selected: 'rgba(15, 118, 110, 0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, letterSpacing: '-0.02em', fontSize: '1.5rem' },
    h5: { fontWeight: 600, letterSpacing: '-0.015em', fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.0625rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem' },
    button: { fontWeight: 600, fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', color: '#64748B' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8FAFC',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        sizeMedium: { minHeight: 40, px: 2 },
        sizeLarge: { minHeight: 44, px: 2.5 },
        sizeSmall: { minHeight: 32 },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: border,
          '&:hover': { borderColor: 'rgba(15, 23, 42, 0.16)', bgcolor: 'rgba(15, 23, 42, 0.02)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: `1px solid ${border}`,
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        outlined: {
          borderColor: border,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${border}`,
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
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: border,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(15, 23, 42, 0.18)',
          },
        },
        input: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(15, 118, 110, 0.1)',
            color: '#115E59',
            '& .MuiListItemIcon-root': { color: '#0F766E' },
            '&:hover': { backgroundColor: 'rgba(15, 118, 110, 0.14)' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
        sizeSmall: { height: 24, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderColor: border,
        },
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(15, 23, 42, 0.02)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          backgroundColor: '#0F172A',
        },
      },
    },
  },
});
