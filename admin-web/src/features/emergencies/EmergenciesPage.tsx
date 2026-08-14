import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Skeleton,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { emergenciesApi } from '@/services/resources.service';
import { StatusChip } from '@/components/common/StatusChip';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';

export function EmergenciesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['emergencies'],
    queryFn: () => emergenciesApi.list({ page: 1, limit: 50 }),
    refetchInterval: 10000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => emergenciesApi.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencies'] });
      toast.show('Emergency acknowledged', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => emergenciesApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencies'] });
      toast.show('Emergency resolved', 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const items = data?.items || [];
  const openCount = items.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <Box>
      <PageHeader
        title="Emergency Alerts"
        description="Urgent but calm handling of SOS alerts from drivers on the road."
        actions={
          openCount > 0 ? (
            <Chip
              color="error"
              variant="outlined"
              label={`${openCount} open`}
              sx={{ fontWeight: 700 }}
            />
          ) : undefined
        }
      />

      <Card variant="outlined">
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {isLoading ? (
            <Box p={2.5}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={88} sx={{ mb: 1.5 }} />
              ))}
            </Box>
          ) : items.length === 0 ? (
            <Box py={8} px={3} textAlign="center">
              <Box
                mx="auto"
                mb={1.5}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(21, 128, 61, 0.08)',
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WarningAmberIcon />
              </Box>
              <Typography fontWeight={600} mb={0.5}>
                No emergency alerts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active SOS reports from drivers will appear here.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {items.map((alert, index) => {
                const isOpen = alert.status === 'ACTIVE';
                return (
                  <Box key={alert.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        px: 2.5,
                        py: 2,
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'stretch', md: 'flex-start' },
                        gap: 2,
                        bgcolor: isOpen ? 'rgba(220, 38, 38, 0.03)' : 'transparent',
                        borderLeft: isOpen ? '3px solid' : '3px solid transparent',
                        borderColor: isOpen ? 'error.main' : 'transparent',
                      }}
                    >
                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap mb={0.75}>
                          <Typography fontWeight={700}>
                            Transport alert · {alert.trip?.bus?.plateNumber || 'Bus'}
                          </Typography>
                          <StatusChip status={alert.status} />
                        </Stack>
                        <Typography variant="body2" color="text.primary" mb={1} sx={{ lineHeight: 1.5 }}>
                          {alert.message || 'Emergency reported. Review location and contact the driver if needed.'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Driver: {alert.trip?.driver?.user?.firstName}{' '}
                          {alert.trip?.driver?.user?.lastName}
                          {' · '}
                          {new Date(alert.createdAt).toLocaleString()}
                          {' · '}
                          {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexShrink={0}
                        justifyContent={{ xs: 'flex-end', md: 'flex-start' }}
                      >
                        {alert.status === 'ACTIVE' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== 'RESOLVED' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => resolveMutation.mutate(alert.id)}
                            disabled={resolveMutation.isPending}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </Stack>
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
