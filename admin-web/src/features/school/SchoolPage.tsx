import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  TextField,
  Typography,
  Skeleton,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { getSchool, updateSchool } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import { StatusChip } from '@/components/common/StatusChip';
import { PageHeader } from '@/components/common/PageHeader';
import { getApiErrorMessage } from '@/services/api';

function SectionLabel({ title, description }: { title: string; description?: string }) {
  return (
    <Box mb={2}>
      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
}

function SchoolPageSkeleton() {
  return (
    <Box maxWidth={880}>
      <Skeleton variant="text" width={220} height={36} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={360} height={24} sx={{ mb: 3 }} />
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
            </Grid>
            <Skeleton variant="rounded" width={140} height={40} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export function SchoolPage() {
  const userSchoolId = useAuthStore((s) => s.user?.schoolId);
  const activeSchoolId = useAuthStore((s) => s.activeSchoolId);
  const schoolId = activeSchoolId || userSchoolId || '';
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: school, isLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => getSchool(schoolId),
    enabled: !!schoolId,
  });

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    timezone: '',
  });

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name,
        address: school.address,
        city: school.city,
        state: school.state,
        phone: school.phone || '',
        email: school.email || '',
        timezone: school.timezone,
      });
    }
  }, [school]);

  const mutation = useMutation({
    mutationFn: () => updateSchool(schoolId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
      toast.show('School updated successfully', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  if (!schoolId) {
    return (
      <Box maxWidth={640}>
        <Typography variant="h5" fontWeight={600} mb={0.5}>
          School Settings
        </Typography>
        <Typography color="text.secondary" mb={3}>
          No school is selected. Enter a school from the platform hub to edit its profile.
        </Typography>
        <Card variant="outlined" sx={{ boxShadow: 'none' }}>
          <CardContent sx={{ py: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">School context required</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isLoading) {
    return <SchoolPageSkeleton />;
  }

  return (
    <Box maxWidth={880}>
      <PageHeader
        title="School Settings"
        description="Update your school profile and contact details used across the platform."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {school?.code && (
              <Chip label={school.code} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            )}
            {school && <StatusChip status={school.isActive ? 'ACTIVE' : 'INACTIVE'} />}
          </Stack>
        }
      />

      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, '&:last-child': { pb: { xs: 2.5, sm: 3.5 } } }}>
          <SectionLabel
            title="Identity"
            description="Basic identifiers for your school. The school code cannot be changed."
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School Code"
                value={school?.code || ''}
                disabled
                helperText="Assigned at creation and used as a unique school identifier"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3.5 }} />

          <SectionLabel
            title="Location"
            description="Address and regional settings for operations and scheduling."
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Timezone"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
            </Grid>
            {school?.country != null && school.country !== '' && (
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Country" value={school.country} disabled />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3.5 }} />

          <SectionLabel
            title="Contact"
            description="How the school can be reached for alerts and communication."
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
          </Grid>

          <Box
            mt={3.5}
            pt={2.5}
            borderTop="1px solid"
            borderColor="divider"
            display="flex"
            flexDirection={{ xs: 'column-reverse', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Typography variant="caption" color="text.secondary">
              Changes apply immediately after saving.
            </Typography>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
            >
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
