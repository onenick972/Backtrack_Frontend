import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ConfirmProvider } from './utils/confirm';
import App from './App';
import theme from './theme';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0a0a0b',
              color: '#f1f1f3',
              fontSize: '13px',
              fontFamily: 'Geist, system-ui, sans-serif',
              borderRadius: 0,
              border: '1px solid #2a2a31',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
