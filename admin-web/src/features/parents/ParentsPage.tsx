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
import { parentsApi } from '@/services/resources.service';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';
import { Parent } from '@/types';

const emptyForm = { email: '', password: '', firstName: '', lastName: '', phone: '', address: '' };

export function ParentsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['parents', page],
    queryFn: () => parentsApi.list({ page: page + 1, limit: 20 }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? parentsApi.update(editing.id, {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            address: form.address || undefined,
          })
        : parentsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.show(editing ? 'Parent updated' : 'Parent created', 'success');
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
      if (!form.email.trim() || !form.password) {
        toast.show('Email and password are required', 'error');
        return;
      }
      if (form.password.length < 8) {
        toast.show('Password must be at least 8 characters', 'error');
        return;
      }
    }
    saveMutation.mutate();
  };

  const openEdit = (parent: Parent) => {
    setEditing(parent);
    setForm({
      email: parent.email,
      password: '',
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone || '',
      address: parent.parentProfile?.address || '',
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="Parents"
        description="Manage parent accounts and contact details"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setDialogOpen(true);
            }}
          >
            Add Parent
          </Button>
        }
      />

      <DataTable
        columns={[
          { id: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
          { id: 'email', label: 'Email', render: (r) => r.email },
          { id: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
          { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status || 'ACTIVE'} /> },
          {
            id: 'actions',
            label: 'Actions',
            render: (r) => (
              <IconButton size="small" title="Edit" aria-label="Edit" onClick={() => openEdit(r)}>
                <EditIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
        rows={data?.items || []}
        loading={isLoading}
        page={page}
        total={data?.pagination.total}
        onPageChange={setPage}
        emptyMessage="No parents yet"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editing ? 'Edit Parent' : 'Add Parent'}</DialogTitle>
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
              <Grid item xs={12}>
                <TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
    </Box>
  );
}
