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
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { busesApi, driversApi } from '@/services/resources.service';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';
import { Bus } from '@/types';

export function BusesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ plateNumber: '', model: '', capacity: 40, driverId: '', status: 'ACTIVE' });

  const { data, isLoading } = useQuery({
    queryKey: ['buses', page],
    queryFn: () => busesApi.list({ page: page + 1, limit: 20 }),
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers-all'],
    queryFn: () => driversApi.list({ page: 1, limit: 100 }),
  });

  const drivers = driversData?.items || [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        plateNumber: form.plateNumber.trim(),
        model: form.model.trim() || undefined,
        capacity: Number(form.capacity),
        driverId: editing ? (form.driverId || null) : form.driverId || undefined,
        ...(editing && { status: form.status }),
      };
      return editing ? busesApi.update(editing.id, payload) : busesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setDialogOpen(false);
      setEditing(null);
      toast.show(editing ? 'Bus updated' : 'Bus created', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber.trim()) {
      toast.show('Plate number is required', 'error');
      return;
    }
    if (!form.capacity || form.capacity < 1) {
      toast.show('Capacity must be at least 1', 'error');
      return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => busesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setDeleteId(null);
      toast.show('Bus deactivated', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const openEdit = (bus: Bus) => {
    setEditing(bus);
    setForm({
      plateNumber: bus.plateNumber,
      model: bus.model || '',
      capacity: bus.capacity,
      driverId: bus.driver?.id || '',
      status: bus.status,
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="Buses"
        description="Manage fleet vehicles and driver assignments"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setForm({ plateNumber: '', model: '', capacity: 40, driverId: '', status: 'ACTIVE' });
              setDialogOpen(true);
            }}
          >
            Add Bus
          </Button>
        }
      />

      <DataTable
        columns={[
          { id: 'plate', label: 'Plate Number', render: (r) => r.plateNumber },
          { id: 'model', label: 'Model', render: (r) => r.model || '—' },
          { id: 'capacity', label: 'Capacity', render: (r) => r.capacity },
          { id: 'driver', label: 'Driver', render: (r) => r.driver?.user ? `${r.driver.user.firstName} ${r.driver.user.lastName}` : '—' },
          { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
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
        emptyMessage="No buses yet"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editing ? 'Edit Bus' : 'Add Bus'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Plate Number" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Driver" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {drivers.filter((d) => d.driverProfile?.id).map((d) => (
                    <MenuItem key={d.id} value={d.driverProfile!.id}>
                      {d.firstName} {d.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {editing && (
                <Grid item xs={12}>
                  <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  </TextField>
                </Grid>
              )}
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
        title="Deactivate Bus"
        message="Are you sure you want to deactivate this bus?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
