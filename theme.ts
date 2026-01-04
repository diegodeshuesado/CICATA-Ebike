
import { createTheme } from '@mui/material/styles';
import { COLORS } from './constants';

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.ipnGuinda,
      contrastText: '#ffffff',
    },
    secondary: {
      main: COLORS.grayMedium,
    },
    success: {
      main: COLORS.greenActive,
    },
    warning: {
      main: COLORS.yellowMaint,
    },
    error: {
      main: COLORS.redInactive,
    },
    info: {
      main: COLORS.blueInfo,
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

export default theme;
