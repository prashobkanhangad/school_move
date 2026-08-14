import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import { createSchool, getPlatformStats, listSchools, updateSchool } from '@/services/auth.service';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { School } from '@/types';
import { reconnectSocket } from '@/services/socket';

const emptyForm = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  country: 'IN',
  phone: '',
  email: '',
  timezone: 'Asia/Kolkata',
  adminEmail: '',
  adminPassword: '',
  adminFirstName: '',
  adminLastName: '',
};

export function SchoolsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const setActiveSchool = useAuthStore((s) => s.setActiveSchool);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['schools', page],
    queryFn: () => listSchools({ page: page + 1, limit: 20 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createSchool({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim() || 'IN',
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        timezone: form.timezone.trim() || 'Asia/Kolkata',
        admin: {
          email: form.adminEmail.trim(),
          password: form.adminPassword,
          firstName: form.adminFirstName.trim(),
          lastName: form.adminLastName.trim(),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.show('School created', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (school: School) => updateSchool(school.id, { isActive: !school.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      toast.show('School updated', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const enterSchool = (school: School) => {
    setActiveSchool(school.id, school.name);
    reconnectSocket();
    navigate('/dashboard');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      toast.show('School details are required', 'error');
      return;
    }
    if (!form.adminEmail.trim() || !form.adminPassword || !form.adminFirstName.trim() || !form.adminLastName.trim()) {
      toast.show('School admin credentials are required', 'error');
      return;
    }
    if (form.adminPassword.length < 8) {
      toast.show('Admin password must be at least 8 characters', 'error');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Box>
      <PageHeader
        title="Schools"
        description="Platform overview and enter a school to manage transport operations."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add School
          </Button>
        }
      />

      {stats && (
        <Grid container spacing={1.5} mb={3}>
          {[
            { label: 'Schools', value: stats.totalSchools },
            { label: 'Active', value: stats.activeSchools },
            { label: 'Drivers', value: stats.totalDrivers },
            { label: 'Students', value: stats.totalStudents },
            { label: 'Buses', value: stats.totalBuses },
            { label: 'Live trips', value: stats.activeTrips },
          ].map((item) => (
            <Grid item xs={6} sm={4} md={2} key={item.label}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.75, px: 2, '&:last-child': { pb: 1.75 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <DataTable
        columns={[
          { id: 'name', label: 'Name', render: (r) => r.name },
          { id: 'code', label: 'Code', render: (r) => r.code },
          { id: 'city', label: 'City', render: (r) => `${r.city}, ${r.state}` },
          {
            id: 'status',
            label: 'Status',
            render: (r) => <StatusChip status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
          },
          {
            id: 'actions',
            label: 'Actions',
            render: (r) => (
              <Box display="flex" gap={1}>
                <Button size="small" variant="contained" startIcon={<LoginIcon />} onClick={() => enterSchool(r)}>
                  Enter
                </Button>
                <Button size="small" onClick={() => toggleActiveMutation.mutate(r)}>
                  {r.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </Box>
            ),
          },
        ]}
        rows={data?.items || []}
        loading={isLoading}
        page={page}
        total={data?.pagination.total}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Create School</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" color="text.secondary" mt={1} mb={1}>
              School details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" mt={3} mb={1}>
              First school admin
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Admin email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Admin password" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required helperText="At least 8 characters" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First name" value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last name" value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} required />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
