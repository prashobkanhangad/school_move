import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { driversApi } from '@/services/resources.service';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';
import { Driver } from '@/types';

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  licenseNumber: '',
};

export function DriversPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page],
    queryFn: () => driversApi.list({ page: page + 1, limit: 20 }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? driversApi.update(editing.id, {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
          })
        : driversApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.show(editing ? 'Driver updated' : 'Driver created', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.show('First and last name are required', 'error');
      return;
    }
    if (!editing) {
      if (!form.email.trim() || !form.password || !form.licenseNumber.trim()) {
        toast.show('Email, password, and license number are required', 'error');
        return;
      }
      if (form.password.length < 8) {
        toast.show('Password must be at least 8 characters', 'error');
        return;
      }
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteId(null);
      toast.show('Driver deactivated', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      email: driver.email,
      password: '',
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone || '',
      licenseNumber: driver.driverProfile?.licenseNumber || '',
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="Drivers"
        description="Manage school bus drivers and their assignments"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add Driver
          </Button>
        }
      />

      <DataTable
        columns={[
          { id: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
          { id: 'email', label: 'Email', render: (r) => r.email },
          { id: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
          { id: 'license', label: 'License', render: (r) => r.driverProfile?.licenseNumber || '—' },
          { id: 'bus', label: 'Assigned Bus', render: (r) => r.assignedBus?.plateNumber || '—' },
          { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status || 'ACTIVE'} /> },
          {
            id: 'actions',
            label: 'Actions',
            render: (r) => (
              <>
                <IconButton size="small" title="Edit" aria-label="Edit" onClick={() => openEdit(r)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" title="Delete" aria-label="Delete" onClick={() => setDeleteId(r.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            ),
          },
        ]}
        rows={data?.items || []}
        loading={isLoading}
        page={page}
        total={data?.pagination.total}
        onPageChange={setPage}
        emptyMessage="No drivers yet"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editing ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {!editing && (
                <>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required helperText="At least 8 characters" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
                  </Grid>
                </>
              )}
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Driver"
        message="Are you sure you want to deactivate this driver?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
