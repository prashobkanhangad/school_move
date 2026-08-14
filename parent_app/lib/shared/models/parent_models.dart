class StopModel {
  StopModel({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.stopType,
  });

  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final String? stopType;

  factory StopModel.fromJson(Map<String, dynamic> json) {
    return StopModel(
      id: json['id'] as String,
      name: json['name'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      stopType: json['stopType'] as String?,
    );
  }
}

class ActiveAssignment {
  ActiveAssignment({
    required this.route,
    this.bus,
    this.pickupStop,
    this.dropStop,
  });

  final RouteInfo route;
  final BusInfo? bus;
  final StopModel? pickupStop;
  final StopModel? dropStop;

  factory ActiveAssignment.fromJson(Map<String, dynamic> json) {
    return ActiveAssignment(
      route: RouteInfo.fromJson(json['route'] as Map<String, dynamic>),
      bus: json['bus'] != null ? BusInfo.fromJson(json['bus'] as Map<String, dynamic>) : null,
      pickupStop: json['pickupStop'] != null
          ? StopModel.fromJson(json['pickupStop'] as Map<String, dynamic>)
          : null,
      dropStop: json['dropStop'] != null
          ? StopModel.fromJson(json['dropStop'] as Map<String, dynamic>)
          : null,
    );
  }
}

class RouteInfo {
  RouteInfo({required this.id, required this.name});

  final String id;
  final String name;

  factory RouteInfo.fromJson(Map<String, dynamic> json) {
    return RouteInfo(id: json['id'] as String, name: json['name'] as String);
  }
}

class BusInfo {
  BusInfo({required this.id, required this.plateNumber});

  final String id;
  final String plateNumber;

  factory BusInfo.fromJson(Map<String, dynamic> json) {
    return BusInfo(
      id: json['id'] as String,
      plateNumber: json['plateNumber'] as String,
    );
  }
}

class ActiveTripSummary {
  ActiveTripSummary({
    required this.id,
    required this.status,
    this.currentLat,
    this.currentLng,
    this.lastLocationAt,
  });

  final String id;
  final String status;
  final double? currentLat;
  final double? currentLng;
  final DateTime? lastLocationAt;

  bool get isActive => status == 'ACTIVE';

  factory ActiveTripSummary.fromJson(Map<String, dynamic> json) {
    return ActiveTripSummary(
      id: json['id'] as String,
      status: json['status'] as String,
      currentLat: (json['currentLat'] as num?)?.toDouble(),
      currentLng: (json['currentLng'] as num?)?.toDouble(),
      lastLocationAt: json['lastLocationAt'] != null
          ? DateTime.parse(json['lastLocationAt'] as String)
          : null,
    );
  }

  ActiveTripSummary copyWith({
    double? currentLat,
    double? currentLng,
    DateTime? lastLocationAt,
  }) {
    return ActiveTripSummary(
      id: id,
      status: status,
      currentLat: currentLat ?? this.currentLat,
      currentLng: currentLng ?? this.currentLng,
      lastLocationAt: lastLocationAt ?? this.lastLocationAt,
    );
  }
}

class ChildModel {
  ChildModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.grade,
    this.activeAssignment,
    this.activeTrip,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String? grade;
  final ActiveAssignment? activeAssignment;
  final ActiveTripSummary? activeTrip;

  String get fullName => '$firstName $lastName';

  factory ChildModel.fromJson(Map<String, dynamic> json) {
    return ChildModel(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      grade: json['grade'] as String?,
      activeAssignment: json['activeAssignment'] != null
          ? ActiveAssignment.fromJson(json['activeAssignment'] as Map<String, dynamic>)
          : null,
      activeTrip: json['activeTrip'] != null
          ? ActiveTripSummary.fromJson(json['activeTrip'] as Map<String, dynamic>)
          : null,
    );
  }

  ChildModel copyWith({ActiveTripSummary? activeTrip}) {
    return ChildModel(
      id: id,
      firstName: firstName,
      lastName: lastName,
      grade: grade,
      activeAssignment: activeAssignment,
      activeTrip: activeTrip ?? this.activeTrip,
    );
  }
}

class EtaModel {
  EtaModel({
    required this.durationText,
    required this.distanceText,
    required this.estimatedArrival,
    this.stopName,
  });

  final String durationText;
  final String distanceText;
  final DateTime estimatedArrival;
  final String? stopName;

  factory EtaModel.fromJson(Map<String, dynamic> json) {
    final eta = json['eta'] as Map<String, dynamic>;
    final stop = json['stop'] as Map<String, dynamic>?;
    return EtaModel(
      durationText: eta['durationText'] as String,
      distanceText: eta['distanceText'] as String,
      estimatedArrival: DateTime.parse(eta['estimatedArrival'] as String),
      stopName: stop?['name'] as String?,
    );
  }
}

class NotificationModel {
  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String status;
  final DateTime createdAt;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class BusLocationUpdate {
  BusLocationUpdate({
    required this.tripId,
    required this.latitude,
    required this.longitude,
    this.heading,
    this.speed,
    this.recordedAt,
  });

  final String tripId;
  final double latitude;
  final double longitude;
  final double? heading;
  final double? speed;
  final DateTime? recordedAt;

  factory BusLocationUpdate.fromJson(Map<String, dynamic> json) {
    return BusLocationUpdate(
      tripId: json['tripId'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      speed: (json['speed'] as num?)?.toDouble(),
      recordedAt: json['recordedAt'] != null
          ? DateTime.tryParse(json['recordedAt'].toString())
          : null,
    );
  }
}
