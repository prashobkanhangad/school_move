import 'package:flutter_test/flutter_test.dart';
import 'package:driver_app/shared/models/trip_model.dart';

void main() {
  group('TripModel', () {
    test('fromJson parses active trip with partial nested bus', () {
      final trip = TripModel.fromJson({
        'id': 'trip1',
        'status': 'ACTIVE',
        'routeId': 'route1',
        'busId': 'bus1',
        'bus': {'id': 'bus1', 'plateNumber': 'MH-01-AB-1234'},
        'route': {
          'id': 'route1',
          'name': 'Route A',
          'stops': [
            {
              'id': 'stop1',
              'name': 'Stop 1',
              'latitude': 19.1,
              'longitude': 72.8,
              'stopOrder': 1,
              'stopType': 'PICKUP',
            },
          ],
        },
      });

      expect(trip.isActive, true);
      expect(trip.bus?.plateNumber, 'MH-01-AB-1234');
      expect(trip.bus?.capacity, isNull);
      expect(trip.route?.stops.length, 1);
    });

    test('fromJson parses active trip', () {
      final trip = TripModel.fromJson({
        'id': 'trip1',
        'status': 'ACTIVE',
        'routeId': 'route1',
        'busId': 'bus1',
        'startedAt': '2026-06-21T07:30:00.000Z',
        'currentLat': 19.115,
        'currentLng': 72.84,
      });

      expect(trip.isActive, true);
      expect(trip.currentLat, 19.115);
    });

    test('isActive is false for completed trip', () {
      final trip = TripModel.fromJson({
        'id': 'trip1',
        'status': 'COMPLETED',
        'routeId': 'route1',
        'busId': 'bus1',
      });
      expect(trip.isActive, false);
    });
  });

  group('LocationUpdate', () {
    test('toJson includes tripId and coordinates', () {
      final update = LocationUpdate(
        latitude: 19.115,
        longitude: 72.84,
        heading: 180,
        speed: 35,
        accuracy: 10,
        recordedAt: DateTime.parse('2026-06-21T07:45:00.000Z'),
      );

      final json = update.toJson('trip1');
      expect(json['tripId'], 'trip1');
      expect(json['latitude'], 19.115);
      expect(json['longitude'], 72.84);
      expect(json['heading'], 180);
    });
  });
}
