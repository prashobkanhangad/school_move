import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { ActiveTrip } from '@/types';

const MAP_CONTAINER_STYLE: CSSProperties = {
  width: '100%',
  height: '420px',
  borderRadius: 8,
};

const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 };
const DEFAULT_ZOOM = 12;

const MAP_OPTIONS: google.maps.MapOptions = {
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

function busMarkerDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
    <path fill="#ffffff" d="M13 15h18c1.1 0 2 .9 2 2v11c0 .55-.45 1-1 1h-1.4a2.4 2.4 0 1 1-4.8 0h-8.6a2.4 2.4 0 1 1-4.8 0H13c-.55 0-1-.45-1-1V17c0-1.1.9-2 2-2zm0 2v9h18v-9H13zm2.2 11.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm13.6 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM16 18h3.5v3.5H16V18zm8.5 0H28v3.5h-3.5V18z"/>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getBusMarkerIcon(isEmergency: boolean): google.maps.Icon {
  return {
    url: busMarkerDataUrl(isEmergency ? '#ea4335' : '#1a73e8'),
    scaledSize: new google.maps.Size(44, 44),
    anchor: new google.maps.Point(22, 22),
  };
}

function tripsWithLocation(trips: ActiveTrip[]): ActiveTrip[] {
  return trips.filter(
    (trip) => trip.location.latitude != null && trip.location.longitude != null
  );
}

function fitMapToTrips(map: google.maps.Map, trips: ActiveTrip[]): void {
  const located = tripsWithLocation(trips);

  if (located.length === 0) {
    map.setCenter(DEFAULT_CENTER);
    map.setZoom(DEFAULT_ZOOM);
    return;
  }

  if (located.length === 1) {
    const trip = located[0];
    map.setCenter({ lat: trip.location.latitude!, lng: trip.location.longitude! });
    map.setZoom(15);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  located.forEach((trip) => {
    bounds.extend({ lat: trip.location.latitude!, lng: trip.location.longitude! });
  });
  map.fitBounds(bounds, 48);
}

interface FleetMapProps {
  trips: ActiveTrip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string | null) => void;
}

export function FleetMap({ trips, selectedTripId, onSelectTrip }: FleetMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<google.maps.Map | null>(null);
  const locatedCountRef = useRef(0);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'school-bus-admin-maps',
  });

  const locatedTrips = useMemo(() => tripsWithLocation(trips), [trips]);
  const selectedTrip = trips.find((trip) => trip.tripId === selectedTripId) ?? null;
  const waitingForGps = trips.length > locatedTrips.length;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    fitMapToTrips(map, trips);
    locatedCountRef.current = locatedTrips.length;
  }, [trips, locatedTrips.length]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (locatedTrips.length !== locatedCountRef.current) {
      fitMapToTrips(mapRef.current, trips);
      locatedCountRef.current = locatedTrips.length;
    }
  }, [trips, locatedTrips.length]);

  useEffect(() => {
    if (!mapRef.current || !selectedTrip) return;
    if (selectedTrip.location.latitude == null || selectedTrip.location.longitude == null) return;
    mapRef.current.panTo({
      lat: selectedTrip.location.latitude,
      lng: selectedTrip.location.longitude,
    });
    mapRef.current.setZoom(15);
  }, [selectedTripId, selectedTrip?.location.latitude, selectedTrip?.location.longitude]);

  if (loadError) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={300}
        bgcolor="action.hover"
        borderRadius={2}
        p={2}
      >
        <Typography color="error" textAlign="center">
          Failed to load Google Maps. Verify <code>VITE_GOOGLE_MAPS_API_KEY</code> and enable
          Maps JavaScript API in Google Cloud Console.
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={420}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={MAP_OPTIONS}
        onClick={() => onSelectTrip(null)}
      >
        {locatedTrips.map((trip) => (
          <Marker
            key={trip.tripId}
            position={{ lat: trip.location.latitude!, lng: trip.location.longitude! }}
            title={trip.bus.plateNumber}
            icon={getBusMarkerIcon(trip.activeEmergencies > 0)}
            onClick={() => onSelectTrip(trip.tripId)}
          />
        ))}

        {selectedTrip &&
          selectedTrip.location.latitude != null &&
          selectedTrip.location.longitude != null && (
            <InfoWindow
              position={{
                lat: selectedTrip.location.latitude,
                lng: selectedTrip.location.longitude,
              }}
              onCloseClick={() => onSelectTrip(null)}
            >
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {selectedTrip.bus.plateNumber}
                </Typography>
                <Typography variant="body2">{selectedTrip.route.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTrip.driver.firstName} {selectedTrip.driver.lastName}
                </Typography>
                {selectedTrip.location.speed != null && (
                  <Typography variant="caption" display="block" mt={0.5}>
                    Speed: {Math.round(selectedTrip.location.speed)} km/h
                  </Typography>
                )}
                {selectedTrip.location.lastLocationAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Updated {new Date(selectedTrip.location.lastLocationAt).toLocaleTimeString()}
                  </Typography>
                )}
                {selectedTrip.activeEmergencies > 0 && (
                  <Typography variant="caption" color="error" fontWeight={700} display="block" mt={0.5}>
                    EMERGENCY ACTIVE
                  </Typography>
                )}
              </Box>
            </InfoWindow>
          )}
      </GoogleMap>

      <Box display="flex" gap={2} flexWrap="wrap" mt={1.5} alignItems="center">
        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
          <Box
            component="img"
            src={busMarkerDataUrl('#1a73e8')}
            alt=""
            sx={{ width: 18, height: 18 }}
          />
          Active bus
        </Typography>
        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
          <Box
            component="img"
            src={busMarkerDataUrl('#ea4335')}
            alt=""
            sx={{ width: 18, height: 18 }}
          />
          Emergency
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {locatedTrips.length} of {trips.length} bus{trips.length !== 1 ? 'es' : ''} on map
        </Typography>
        {waitingForGps && (
          <Typography variant="caption" color="warning.main">
            Waiting for GPS from {trips.length - locatedTrips.length} bus
            {trips.length - locatedTrips.length !== 1 ? 'es' : ''}…
          </Typography>
        )}
      </Box>
    </Box>
  );
}
