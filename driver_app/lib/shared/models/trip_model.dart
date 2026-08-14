import 'route_model.dart';

class TripModel {
  TripModel({
    required this.id,
    required this.status,
    required this.routeId,
    required this.busId,
    this.startedAt,
    this.endedAt,
    this.currentLat,
    this.currentLng,
    this.lastLocationAt,
    this.route,
    this.bus,
  });

  final String id;
  final String status;
  final String routeId;
  final String busId;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final double? currentLat;
  final double? currentLng;
  final DateTime? lastLocationAt;
  final RouteModel? route;
  final BusModel? bus;

  bool get isActive => status == 'ACTIVE';

  factory TripModel.fromJson(Map<String, dynamic> json) {
    return TripModel(
      id: json['id'] as String,
      status: json['status'] as String,
      routeId: json['routeId'] as String,
      busId: json['busId'] as String,
      startedAt: json['startedAt'] != null ? DateTime.parse(json['startedAt'] as String) : null,
      endedAt: json['endedAt'] != null ? DateTime.parse(json['endedAt'] as String) : null,
      currentLat: (json['currentLat'] as num?)?.toDouble(),
      currentLng: (json['currentLng'] as num?)?.toDouble(),
      lastLocationAt:
          json['lastLocationAt'] != null ? DateTime.parse(json['lastLocationAt'] as String) : null,
      route: json['route'] is Map<String, dynamic>
          ? RouteModel.fromJson(json['route'] as Map<String, dynamic>)
          : null,
      bus: json['bus'] is Map<String, dynamic>
          ? BusModel.fromJson(json['bus'] as Map<String, dynamic>)
          : null,
    );
  }
}

class LocationUpdate {
  LocationUpdate({
    required this.latitude,
    required this.longitude,
    this.heading,
    this.speed,
    this.accuracy,
    required this.recordedAt,
  });

  final double latitude;
  final double longitude;
  final double? heading;
  final double? speed;
  final double? accuracy;
  final DateTime recordedAt;

  Map<String, dynamic> toJson(String tripId) => {
        'tripId': tripId,
        'latitude': latitude,
        'longitude': longitude,
        if (heading != null) 'heading': heading,
        if (speed != null) 'speed': speed,
        if (accuracy != null) 'accuracy': accuracy,
        'recordedAt': recordedAt.toUtc().toIso8601String(),
      };
}
