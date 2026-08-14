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
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { studentsApi, parentsApi, routesApi } from '@/services/resources.service';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';
import { Student, Route } from '@/types';

export function StudentsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ parentId: '', firstName: '', lastName: '', grade: '', section: '' });
  const [assignForm, setAssignForm] = useState({ routeId: '', pickupStopId: '', dropStopId: '' });
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', page],
    queryFn: () => studentsApi.list({ page: page + 1, limit: 20 }),
  });

  const { data: parentsData } = useQuery({
    queryKey: ['parents-all'],
    queryFn: () => parentsApi.list({ page: 1, limit: 100 }),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes-all'],
    queryFn: () => routesApi.list({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () => studentsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setCreateOpen(false);
      setForm({ parentId: '', firstName: '', lastName: '', grade: '', section: '' });
      toast.show('Student created', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentId) {
      toast.show('Please select a parent', 'error');
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.show('First and last name are required', 'error');
      return;
    }
    createMutation.mutate();
  };

  const assignMutation = useMutation({
    mutationFn: () => studentsApi.assign(selectedStudent!.id, assignForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setAssignOpen(false);
      toast.show('Student assigned to route', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.routeId || !assignForm.pickupStopId || !assignForm.dropStopId) {
      toast.show('Route and both stops are required', 'error');
      return;
    }
    assignMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteId(null);
      toast.show('Student deactivated', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const handleRouteSelect = async (routeId: string) => {
    setAssignForm({ ...assignForm, routeId, pickupStopId: '', dropStopId: '' });
    if (routeId) {
      const route = await routesApi.get(routeId);
      setSelectedRoute(route);
    } else {
      setSelectedRoute(null);
    }
  };

  const openAssign = (student: Student) => {
    setSelectedStudent(student);
    setAssignForm({ routeId: '', pickupStopId: '', dropStopId: '' });
    setSelectedRoute(null);
    setAssignOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="Students"
        description="Manage students and assign them to routes"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Add Student
          </Button>
        }
      />

      <DataTable
        columns={[
          { id: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
          { id: 'grade', label: 'Grade', render: (r) => r.grade || '—' },
          { id: 'parent', label: 'Parent', render: (r) => r.parent?.user ? `${r.parent.user.firstName} ${r.parent.user.lastName}` : '—' },
          { id: 'route', label: 'Route', render: (r) => r.assignments?.find((a) => a.status === 'ACTIVE')?.route?.name || '—' },
          {
            id: 'actions',
            label: 'Actions',
            render: (r) => (
              <>
                <IconButton size="small" title="Assign" aria-label="Assign" onClick={() => openAssign(r)}>
                  <AssignmentIcon fontSize="small" />
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
        emptyMessage="No students yet"
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Add Student</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth select label="Parent" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} required>
                  {(parentsData?.items || [])
                    .filter((p) => p.parentProfile?.id)
                    .map((p) => (
                      <MenuItem key={p.id} value={p.parentProfile!.id}>
                        {p.firstName} {p.lastName} ({p.email})
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAssign}>
          <DialogTitle>Assign {selectedStudent?.firstName} to Route</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth select label="Route" value={assignForm.routeId} onChange={(e) => handleRouteSelect(e.target.value)} required>
                  {(routesData?.items || []).map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Pickup Stop" value={assignForm.pickupStopId} onChange={(e) => setAssignForm({ ...assignForm, pickupStopId: e.target.value })} required>
                  {(selectedRoute?.stops || []).map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.stopOrder}. {s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Drop Stop" value={assignForm.dropStopId} onChange={(e) => setAssignForm({ ...assignForm, dropStopId: e.target.value })} required>
                  {(selectedRoute?.stops || []).map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.stopOrder}. {s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assignMutation.isPending}>Assign</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Student"
        message="Are you sure you want to deactivate this student?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
