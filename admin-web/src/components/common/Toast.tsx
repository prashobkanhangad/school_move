import { Alert, Snackbar } from '@mui/material';
import { create } from 'zustand';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  show: (message: string, severity?: ToastState['severity']) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  show: (message, severity = 'info') => set({ open: true, message, severity }),
  hide: () => set({ open: false }),
}));

export function ToastProvider() {
  const { open, message, severity, hide } = useToast();
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={hide} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert onClose={hide} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
