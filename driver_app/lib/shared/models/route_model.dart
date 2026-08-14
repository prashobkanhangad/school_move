class BusModel {
  BusModel({
    required this.id,
    required this.plateNumber,
    this.capacity,
    this.status = 'ACTIVE',
    this.model,
    this.driverId,
  });

  final String id;
  final String plateNumber;
  final int? capacity;
  final String status;
  final String? model;
  final String? driverId;

  factory BusModel.fromJson(Map<String, dynamic> json) {
    return BusModel(
      id: json['id'] as String,
      plateNumber: json['plateNumber'] as String,
      capacity: _readInt(json['capacity']),
      status: json['status'] as String? ?? 'ACTIVE',
      model: json['model'] as String?,
      driverId: json['driverId'] as String?,
    );
  }
}

class RouteStopModel {
  RouteStopModel({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.stopOrder,
    required this.stopType,
  });

  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final int stopOrder;
  final String stopType;

  factory RouteStopModel.fromJson(Map<String, dynamic> json) {
    return RouteStopModel(
      id: json['id'] as String,
      name: json['name'] as String,
      latitude: _readDouble(json['latitude']),
      longitude: _readDouble(json['longitude']),
      stopOrder: _readInt(json['stopOrder']) ?? 0,
      stopType: json['stopType'] as String? ?? 'BOTH',
    );
  }
}

class RouteModel {
  RouteModel({
    required this.id,
    required this.name,
    required this.status,
    this.description,
    this.startTime,
    this.bus,
    this.stops = const [],
  });

  final String id;
  final String name;
  final String status;
  final String? description;
  final String? startTime;
  final BusModel? bus;
  final List<RouteStopModel> stops;

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    return RouteModel(
      id: json['id'] as String,
      name: json['name'] as String,
      status: json['status'] as String? ?? 'ACTIVE',
      description: json['description'] as String?,
      startTime: json['startTime'] as String?,
      bus: json['bus'] is Map<String, dynamic>
          ? BusModel.fromJson(json['bus'] as Map<String, dynamic>)
          : null,
      stops: (json['stops'] as List<dynamic>?)
              ?.map((e) => RouteStopModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

int? _readInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString());
}

double _readDouble(dynamic value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.parse(value.toString());
}
