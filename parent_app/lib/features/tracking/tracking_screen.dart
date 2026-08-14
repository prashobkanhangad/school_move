import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/parent_models.dart';
import '../../shared/providers/app_providers.dart';
import '../../shared/services/socket_service.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key, required this.childId});

  final String childId;

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  GoogleMapController? _mapController;
  Timer? _etaTimer;
  double? _lastCameraLat;
  double? _lastCameraLng;
  bool _followBus = true;
  String? _subscribedTripId;
  SocketService? _socket;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _socket = ref.read(socketServiceProvider);
      _initTracking();
    });
  }

  Future<void> _initTracking() async {
    await ref.read(childrenProvider.notifier).refresh();
    if (!mounted) return;

    final child = _findChild();
    final trip = child?.activeTrip;
    if (trip?.isActive == true) {
      _subscribedTripId = trip!.id;
      final SocketService socket = _socket ?? ref.read(socketServiceProvider);
      _socket = socket;
      await socket.subscribeTrip(trip.id);
      ref.read(trackingProvider(widget.childId).notifier).fetchEta(trip.id, child!.id);
      _etaTimer?.cancel();
      _etaTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (!mounted) return;
        final c = _findChild();
        if (c?.activeTrip?.isActive == true) {
          ref.read(trackingProvider(widget.childId).notifier).fetchEta(
                c!.activeTrip!.id,
                c.id,
              );
        }
      });
    }
  }

  ChildModel? _findChild() {
    final children = ref.read(childrenProvider).children;
    for (final child in children) {
      if (child.id == widget.childId) return child;
    }
    return null;
  }

  @override
  void dispose() {
    _etaTimer?.cancel();
    final tripId = _subscribedTripId;
    if (tripId != null) {
      _socket?.unsubscribeTrip(tripId);
    }
    _mapController?.dispose();
    super.dispose();
  }

  void _maybeAnimateToBus(double lat, double lng) {
    if (!_followBus) return;
    if (_lastCameraLat == lat && _lastCameraLng == lng) return;
    _lastCameraLat = lat;
    _lastCameraLng = lng;
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(LatLng(lat, lng), 15),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<ChildrenState>(childrenProvider, (_, next) {
      ChildModel? child;
      for (final c in next.children) {
        if (c.id == widget.childId) {
          child = c;
          break;
        }
      }
      final lat = child?.activeTrip?.currentLat;
      final lng = child?.activeTrip?.currentLng;
      if (lat != null && lng != null) {
        _maybeAnimateToBus(lat, lng);
      }
    });

    final childrenState = ref.watch(childrenProvider);
    ChildModel? child;
    for (final c in childrenState.children) {
      if (c.id == widget.childId) {
        child = c;
        break;
      }
    }
    final trackingState = ref.watch(trackingProvider(widget.childId));

    if (child == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        ),
        body: Center(
          child: childrenState.isLoading
              ? const CircularProgressIndicator()
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      childrenState.error != null
                          ? 'Could not load child details'
                          : 'Child not found',
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _initTracking,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
        ),
      );
    }

    final trip = child.activeTrip;
    final assignment = child.activeAssignment;
    final busLat = trip?.currentLat;
    final busLng = trip?.currentLng;
    final pickup = assignment?.pickupStop;

    final markers = <Marker>{
      if (busLat != null && busLng != null)
        Marker(
          markerId: const MarkerId('bus'),
          position: LatLng(busLat, busLng),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: InfoWindow(title: assignment?.bus?.plateNumber ?? 'School Bus'),
        ),
      if (pickup != null)
        Marker(
          markerId: const MarkerId('pickup'),
          position: LatLng(pickup.latitude, pickup.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(title: 'Pickup: ${pickup.name}'),
        ),
      if (assignment?.dropStop != null)
        Marker(
          markerId: const MarkerId('drop'),
          position: LatLng(assignment!.dropStop!.latitude, assignment.dropStop!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
          infoWindow: InfoWindow(title: 'Drop: ${assignment.dropStop!.name}'),
        ),
    };

    final initialPosition = busLat != null && busLng != null
        ? LatLng(busLat, busLng)
        : (pickup != null
            ? LatLng(pickup.latitude, pickup.longitude)
            : const LatLng(19.0760, 72.8777));

    return Scaffold(
      appBar: AppBar(
        title: Text('Tracking ${child.firstName}'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        actions: [
          IconButton(
            tooltip: _followBus ? 'Following bus' : 'Follow bus',
            icon: Icon(_followBus ? Icons.gps_fixed : Icons.gps_not_fixed),
            onPressed: () {
              setState(() => _followBus = !_followBus);
              if (_followBus && busLat != null && busLng != null) {
                _lastCameraLat = null;
                _lastCameraLng = null;
                _maybeAnimateToBus(busLat, busLng);
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _initTracking,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                SizedBox.expand(
                  child: GoogleMap(
                    mapType: MapType.normal,
                    initialCameraPosition: CameraPosition(target: initialPosition, zoom: 14),
                    markers: markers,
                    myLocationButtonEnabled: false,
                    zoomControlsEnabled: true,
                    compassEnabled: false,
                    onMapCreated: (controller) {
                      _mapController = controller;
                      if (busLat != null && busLng != null) {
                        _maybeAnimateToBus(busLat, busLng);
                      }
                    },
                  ),
                ),
                if (trip?.isActive != true)
                  Container(
                    color: Colors.black26,
                    alignment: Alignment.center,
                    child: Card(
                      margin: const EdgeInsets.all(24),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.directions_bus_outlined, size: 48, color: AppTheme.textSecondary),
                            const SizedBox(height: 12),
                            const Text('Bus is not on an active trip', textAlign: TextAlign.center),
                            if (assignment?.bus != null)
                              Text(
                                'Assigned: ${assignment!.bus!.plateNumber}',
                                style: const TextStyle(color: AppTheme.textSecondary),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          _BottomPanel(
            child: child,
            trackingState: trackingState,
            onRefreshEta: () {
              final c = child;
              if (trip?.isActive == true && c != null) {
                ref.read(trackingProvider(widget.childId).notifier).fetchEta(trip!.id, c.id);
              }
            },
          ),
        ],
      ),
    );
  }
}

class _BottomPanel extends StatelessWidget {
  const _BottomPanel({
    required this.child,
    required this.trackingState,
    required this.onRefreshEta,
  });

  final ChildModel child;
  final TrackingState trackingState;
  final VoidCallback onRefreshEta;

  @override
  Widget build(BuildContext context) {
    final trip = child.activeTrip;
    final assignment = child.activeAssignment;
    final timeFormat = DateFormat('HH:mm');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  assignment?.bus?.plateNumber ?? 'No bus',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              if (trip?.isActive == true)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.navy.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'ON ROUTE',
                    style: TextStyle(
                      color: AppTheme.navy,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
            ],
          ),
          Text(assignment?.route.name ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
          const SizedBox(height: 16),
          if (trip?.isActive == true) ...[
            if (trackingState.isLoadingEta)
              const LinearProgressIndicator()
            else if (trackingState.eta != null) ...[
              Row(
                children: [
                  _EtaChip(
                    icon: Icons.schedule,
                    label: 'ETA',
                    value: trackingState.eta!.durationText,
                  ),
                  const SizedBox(width: 12),
                  _EtaChip(
                    icon: Icons.straighten,
                    label: 'Distance',
                    value: trackingState.eta!.distanceText,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Arriving at ${trackingState.eta!.stopName ?? 'pickup'} around ${timeFormat.format(trackingState.eta!.estimatedArrival.toLocal())}',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              ),
            ] else if (trackingState.etaError != null)
              Text(trackingState.etaError!, style: const TextStyle(color: AppTheme.danger, fontSize: 13)),
            const SizedBox(height: 8),
            if (trip?.lastLocationAt != null)
              Text(
                'Last updated: ${timeFormat.format(trip!.lastLocationAt!.toLocal())}',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
              ),
            TextButton.icon(
              onPressed: onRefreshEta,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Refresh ETA'),
            ),
          ] else
            const Text(
              'The bus will appear on the map when the driver starts the trip.',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          if (assignment?.pickupStop != null) ...[
            const Divider(height: 24),
            Row(
              children: [
                const Icon(Icons.location_on, size: 18, color: AppTheme.navy),
                const SizedBox(width: 8),
                Expanded(child: Text('Pickup: ${assignment!.pickupStop!.name}')),
              ],
            ),
          ],
          if (assignment?.dropStop != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Row(
                children: [
                  const Icon(Icons.location_on, size: 18, color: AppTheme.orange),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Drop: ${assignment!.dropStop!.name}')),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _EtaChip extends StatelessWidget {
  const _EtaChip({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.orange.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 16),
                const SizedBox(width: 4),
                Text(label, style: const TextStyle(fontSize: 12)),
              ],
            ),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
