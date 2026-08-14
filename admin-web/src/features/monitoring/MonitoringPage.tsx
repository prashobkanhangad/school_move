import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Alert,
  Skeleton,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { getActiveTrips } from '@/services/auth.service';
import { connectSocket } from '@/services/socket';
import { PageHeader } from '@/components/common/PageHeader';
import { ActiveTrip } from '@/types';
import { FleetMap } from './FleetMap';

function formatGpsAge(iso?: string | null) {
  if (!iso) return 'No GPS yet';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Updated ${minutes}m ago`;
}

function gpsTone(iso?: string | null): 'success' | 'warning' | 'default' {
  if (!iso) return 'default';
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 30) return 'success';
  if (seconds < 120) return 'warning';
  return 'default';
}

export function MonitoringPage() {
  const queryClient = useQueryClient();
  const [liveTrips, setLiveTrips] = useState<ActiveTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['active-trips'],
    queryFn: getActiveTrips,
    refetchInterval: 15000,
  });

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!trips) return;
    setLiveTrips((prev) => {
      const prevById = new Map(prev.map((t) => [t.tripId, t]));
      return trips.map((apiTrip) => {
        const live = prevById.get(apiTrip.tripId);
        if (!live?.location?.lastLocationAt) return apiTrip;

        const apiAt = apiTrip.location?.lastLocationAt
          ? new Date(apiTrip.location.lastLocationAt).getTime()
          : 0;
        const liveAt = new Date(live.location.lastLocationAt).getTime();

        if (liveAt > apiAt) {
          return { ...apiTrip, location: live.location };
        }
        return apiTrip;
      });
    });
  }, [trips]);

  const handleLocationUpdate = useCallback(
    (payload: {
      tripId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      recordedAt?: string;
    }) => {
      setLiveTrips((prev) =>
        prev.map((trip) =>
          trip.tripId === payload.tripId
            ? {
                ...trip,
                location: {
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  heading: payload.heading,
                  speed: payload.speed,
                  lastLocationAt: payload.recordedAt || new Date().toISOString(),
                },
              }
            : trip
        )
      );
    },
    []
  );

  useEffect(() => {
    const socket = connectSocket();

    const onTripStatus = () => {
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
    };
    const onEmergency = () => {
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
    };

    socket.on('bus:location', handleLocationUpdate);
    socket.on('trip:status', onTripStatus);
    socket.on('emergency:alert', onEmergency);

    return () => {
      socket.off('bus:location', handleLocationUpdate);
      socket.off('trip:status', onTripStatus);
      socket.off('emergency:alert', onEmergency);
    };
  }, [handleLocationUpdate, queryClient]);

  const hasMapsKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const selected = liveTrips.find((t) => t.tripId === selectedTripId) ?? null;

  return (
    <Box>
      <PageHeader
        title="Live Tracking"
        description={`${liveTrips.length} active trip${liveTrips.length !== 1 ? 's' : ''} · locations refresh in real time`}
      />

      {!hasMapsKey && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in .env to enable the map view. Bus locations
          still update live via WebSocket in the list.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card variant="outlined" sx={{ minHeight: 440, height: '100%' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, height: '100%' }}>
              <Box
                px={2}
                py={1.5}
                borderBottom="1px solid"
                borderColor="divider"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Fleet map
                </Typography>
                <Chip
                  size="small"
                  label={liveTrips.length ? 'Live' : 'Idle'}
                  color={liveTrips.length ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>

              <Box p={2}>
                {liveTrips.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight={340}
                    color="text.secondary"
                  >
                    <GpsFixedIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.35 }} />
                    <Typography fontWeight={600} color="text.primary">
                      No active trips right now
                    </Typography>
                    <Typography variant="body2" mt={0.5} textAlign="center">
                      Buses appear here when a driver starts a trip.
                    </Typography>
                  </Box>
                ) : hasMapsKey ? (
                  <FleetMap
                    trips={liveTrips}
                    selectedTripId={selectedTripId}
                    onSelectTrip={setSelectedTripId}
                  />
                ) : (
                  <TripLocationList
                    trips={liveTrips}
                    selectedTripId={selectedTripId}
                    onSelectTrip={setSelectedTripId}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Box px={2} py={1.5} borderBottom="1px solid" borderColor="divider">
                  <Typography variant="subtitle2" color="text.secondary">
                    Active buses
                  </Typography>
                </Box>
                {isLoading ? (
                  <Box p={2}>
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} height={64} sx={{ mb: 1 }} />
                    ))}
                  </Box>
                ) : liveTrips.length === 0 ? (
                  <Typography color="text.secondary" variant="body2" py={5} textAlign="center">
                    No buses on route
                  </Typography>
                ) : (
                  <List disablePadding>
                    {liveTrips.map((trip) => {
                      const selectedRow = selectedTripId === trip.tripId;
                      const tone = gpsTone(trip.location.lastLocationAt);
                      return (
                        <ListItem key={trip.tripId} disablePadding divider>
                          <ListItemButton
                            selected={selectedRow}
                            onClick={() =>
                              setSelectedTripId((current) =>
                                current === trip.tripId ? null : trip.tripId
                              )
                            }
                            sx={{ py: 1.5, px: 2, alignItems: 'flex-start' }}
                          >
                            <Box width="100%">
                              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Typography fontWeight={700} fontSize={14}>
                                  {trip.bus.plateNumber}
                                </Typography>
                                {trip.activeEmergencies > 0 && (
                                  <Chip label="Emergency" color="error" size="small" />
                                )}
                              </Stack>
                              <Typography variant="body2" color="text.secondary" mb={0.25}>
                                {trip.route.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Driver: {trip.driver.firstName} {trip.driver.lastName}
                                {' · '}
                                {trip.studentCount} students
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center" mt={0.75}>
                                <Chip
                                  size="small"
                                  label={
                                    tone === 'success'
                                      ? 'GPS Online'
                                      : tone === 'warning'
                                        ? 'GPS Delayed'
                                        : 'GPS Offline'
                                  }
                                  color={tone === 'default' ? 'default' : tone}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatGpsAge(trip.location.lastLocationAt)}
                                </Typography>
                              </Stack>
                            </Box>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>

            {selected && (
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
                    Selected bus
                  </Typography>
                  <Typography fontWeight={700} mb={0.5}>
                    {selected.bus.plateNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    {selected.route.name}
                  </Typography>
                  <DetailRow label="Driver" value={`${selected.driver.firstName} ${selected.driver.lastName}`} />
                  <DetailRow label="Students" value={String(selected.studentCount)} />
                  <DetailRow
                    label="Speed"
                    value={
                      selected.location.speed != null
                        ? `${Math.round(selected.location.speed)} km/h`
                        : '—'
                    }
                  />
                  <DetailRow
                    label="Location"
                    value={
                      selected.location.latitude != null && selected.location.longitude != null
                        ? `${selected.location.latitude.toFixed(5)}, ${selected.location.longitude.toFixed(5)}`
                        : 'Waiting for GPS'
                    }
                  />
                  <DetailRow label="GPS" value={formatGpsAge(selected.location.lastLocationAt)} />
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Box>
  );
}

function TripLocationList({
  trips,
  selectedTripId,
  onSelectTrip,
}: {
  trips: ActiveTrip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string | null) => void;
}) {
  return (
    <List disablePadding>
      {trips.map((trip) => (
        <ListItem
          key={trip.tripId}
          divider
          sx={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            bgcolor: selectedTripId === trip.tripId ? 'action.selected' : undefined,
            cursor: 'pointer',
            py: 1.5,
            px: 0,
          }}
          onClick={() => onSelectTrip(selectedTripId === trip.tripId ? null : trip.tripId)}
        >
          <Box display="flex" justifyContent="space-between" width="100%" alignItems="center" mb={0.5}>
            <Typography fontWeight={600}>
              {trip.bus.plateNumber} — {trip.route.name}
            </Typography>
            {trip.activeEmergencies > 0 && <Chip label="Emergency" color="error" size="small" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Driver: {trip.driver.firstName} {trip.driver.lastName}
          </Typography>
          {trip.location.latitude != null && trip.location.longitude != null ? (
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              {trip.location.latitude.toFixed(5)}, {trip.location.longitude.toFixed(5)}
              {trip.location.speed ? ` · ${Math.round(trip.location.speed)} km/h` : ''}
              {' · '}
              {formatGpsAge(trip.location.lastLocationAt)}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              Waiting for GPS…
            </Typography>
          )}
        </ListItem>
      ))}
    </List>
  );
}
