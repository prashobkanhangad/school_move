import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { notificationsApi } from '@/services/resources.service';
import { StatusChip } from '@/components/common/StatusChip';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/Toast';
import { getApiErrorMessage } from '@/services/api';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', target: 'ALL_PARENTS' });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ page: 1, limit: 50 }),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => notificationsApi.broadcast(form),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setBroadcastOpen(false);
      toast.show(`Sent to ${result?.sentCount ?? 0} users`, 'success');
    },
    onError: (err) => toast.show(getApiErrorMessage(err), 'error'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.show('All marked as read', 'success');
    },
  });

  return (
    <Box>
      <PageHeader
        title="Notifications"
        description="Review in-app alerts and broadcast messages to parents or drivers."
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<MarkEmailReadIcon />}
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              Mark All Read
            </Button>
            <Button variant="contained" startIcon={<SendIcon />} onClick={() => setBroadcastOpen(true)}>
              Broadcast
            </Button>
          </>
        }
      />

      <Card variant="outlined" sx={{ boxShadow: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {isLoading ? (
            <Box p={2.5}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5 }} />
              ))}
            </Box>
          ) : (
            <List disablePadding>
              {(data?.items || []).map((n) => {
                const unread = n.status !== 'READ';
                return (
                  <ListItem
                    key={n.id}
                    divider
                    alignItems="flex-start"
                    sx={{
                      px: 2.5,
                      py: 2,
                      bgcolor: unread ? 'rgba(15, 118, 110, 0.03)' : 'transparent',
                      borderLeft: unread ? '3px solid' : '3px solid transparent',
                      borderColor: unread ? 'primary.main' : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap mb={0.5}>
                          <Typography fontWeight={unread ? 700 : 600}>{n.title}</Typography>
                          <StatusChip status={n.status} />
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            {n.body}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span" display="block" mt={0.75}>
                            {n.type.replace(/_/g, ' ')} · {new Date(n.createdAt).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
              {!data?.items?.length && (
                <Box py={8} px={3} textAlign="center">
                  <Typography fontWeight={600} mb={0.5}>
                    You’re all caught up
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Transport alerts and broadcasts will appear here.
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Broadcast</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                <MenuItem value="ALL_PARENTS">All Parents</MenuItem>
                <MenuItem value="ALL_DRIVERS">All Drivers</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Message" multiline rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBroadcastOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => broadcastMutation.mutate()} disabled={broadcastMutation.isPending}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
