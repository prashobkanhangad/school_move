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
  Typography,
  IconButton,
  Grid,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { routesApi, busesApi } from '@/services/resources.service';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';
import { Route, RouteStop } from '@/types';

interface StopForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  stopOrder: number;
  stopType: string;
  radiusM: number;
}

const emptyStop = (): StopForm => ({
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  stopOrder: 1,
  stopType: 'BOTH',
  radiusM: 100,
});

export function RoutesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRoute, setViewRoute] = useState<Route | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', busId: '', startTime: '' });
  const [stops, setStops] = useState<StopForm[]>([emptyStop()]);

  const { data, isLoading } = useQuery({
    queryKey: ['routes', page],
    queryFn: () => routesApi.list({ page: page + 1, limit: 20 }),
  });

  const { data: busesData } = useQuery({
    queryKey: ['buses-all'],
    queryFn: () => busesApi.list({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      routesApi.create({
        ...form,
        busId: form.busId || undefined,
        stops: stops.map((s, i) => ({
          name: s.name,
          address: s.address || undefined,
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
          stopOrder: s.stopOrder || i + 1,
          stopType: s.stopType,
          radiusM: s.radiusM,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setDialogOpen(false);
      toast.show('Route created', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setDeleteId(null);
      toast.show('Route deactivated', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const viewMutation = useMutation({
    mutationFn: (id: string) => routesApi.get(id),
    onSuccess: (route) => setViewRoute(route),
  });

  const addStop = () => setStops([...stops, { ...emptyStop(), stopOrder: stops.length + 1 }]);

  const updateStop = (index: number, field: keyof StopForm, value: string | number) => {
    const updated = [...stops];
    updated[index] = { ...updated[index], [field]: value };
    setStops(updated);
  };

  return (
    <Box>
      <PageHeader
        title="Routes"
        description="Manage bus routes, stops, and schedules"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setForm({ name: '', description: '', busId: '', startTime: '' });
              setStops([emptyStop()]);
              setDialogOpen(true);
            }}
          >
            Add Route
          </Button>
        }
      />

      <DataTable
        columns={[
          { id: 'name', label: 'Name', render: (r) => r.name },
          { id: 'bus', label: 'Bus', render: (r) => r.bus?.plateNumber || '—' },
          { id: 'start', label: 'Start Time', render: (r) => r.startTime || '—' },
          { id: 'students', label: 'Students', render: (r) => r.studentCount ?? 0 },
          { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
          {
            id: 'actions',
            label: 'Actions',
            render: (r) => (
              <>
                <IconButton size="small" title="View" aria-label="View" onClick={() => viewMutation.mutate(r.id)}>
                  <VisibilityIcon fontSize="small" />
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
        emptyMessage="No routes yet"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Route</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Route Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Start Time" placeholder="07:30" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Bus" value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {(busesData?.items || []).map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.plateNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight={600} mt={3} mb={1}>Stops</Typography>
          {stops.map((stop, i) => (
            <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Stop Name" value={stop.name} onChange={(e) => updateStop(i, 'name', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField fullWidth label="Lat" value={stop.latitude} onChange={(e) => updateStop(i, 'latitude', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField fullWidth label="Lng" value={stop.longitude} onChange={(e) => updateStop(i, 'longitude', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField fullWidth select label="Type" value={stop.stopType} onChange={(e) => updateStop(i, 'stopType', e.target.value)} size="small">
                    <MenuItem value="PICKUP">Pickup</MenuItem>
                    <MenuItem value="DROP">Drop</MenuItem>
                    <MenuItem value="BOTH">Both</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField fullWidth label="Order" type="number" value={stop.stopOrder} onChange={(e) => updateStop(i, 'stopOrder', Number(e.target.value))} size="small" />
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button size="small" onClick={addStop}>+ Add Stop</Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRoute} onClose={() => setViewRoute(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{viewRoute?.name} — Stops</DialogTitle>
        <DialogContent>
          <List>
            {(viewRoute?.stops || []).map((stop: RouteStop) => (
              <ListItem key={stop.id} divider>
                <ListItemText
                  primary={`${stop.stopOrder}. ${stop.name}`}
                  secondary={`${stop.latitude}, ${stop.longitude} · ${stop.stopType}`}
                />
                <Chip label={stop.stopType} size="small" />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setViewRoute(null)}>Close</Button></DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Route"
        message="Are you sure you want to deactivate this route?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
