import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/shared/models/parent_models.dart';

void main() {
  group('ChildModel', () {
    test('fromJson parses children with active trip', () {
      final child = ChildModel.fromJson({
        'id': 'child1',
        'firstName': 'Aarav',
        'lastName': 'Sharma',
        'grade': '5',
        'activeAssignment': {
          'route': {'id': 'route1', 'name': 'Route A'},
          'bus': {'id': 'bus1', 'plateNumber': 'MH-01-AB-1234'},
          'pickupStop': {
            'id': 'stop1',
            'name': 'Andheri',
            'latitude': 19.1197,
            'longitude': 72.8468,
            'stopType': 'PICKUP',
          },
          'dropStop': {
            'id': 'stop2',
            'name': 'Bandra',
            'latitude': 19.0596,
            'longitude': 72.8295,
            'stopType': 'DROP',
          },
        },
        'activeTrip': {
          'id': 'trip1',
          'status': 'ACTIVE',
          'currentLat': 19.1,
          'currentLng': 72.84,
          'lastLocationAt': '2026-06-21T07:45:00.000Z',
        },
      });

      expect(child.fullName, 'Aarav Sharma');
      expect(child.activeAssignment?.bus?.plateNumber, 'MH-01-AB-1234');
      expect(child.activeTrip?.isActive, true);
      expect(child.activeTrip?.currentLat, 19.1);
    });

    test('copyWith updates active trip location', () {
      final child = ChildModel(
        id: 'c1',
        firstName: 'A',
        lastName: 'B',
      );
      final updated = child.copyWith(
        activeTrip: ActiveTripSummary(
          id: 't1',
          status: 'ACTIVE',
          currentLat: 19.2,
          currentLng: 72.9,
        ),
      );
      expect(updated.activeTrip?.currentLat, 19.2);
    });
  });

  group('BusLocationUpdate', () {
    test('fromJson parses socket payload', () {
      final update = BusLocationUpdate.fromJson({
        'tripId': 'trip1',
        'latitude': 19.115,
        'longitude': 72.84,
        'speed': 35.2,
      });
      expect(update.tripId, 'trip1');
      expect(update.latitude, 19.115);
    });
  });

  group('EtaModel', () {
    test('fromJson parses ETA response', () {
      final eta = EtaModel.fromJson({
        'stop': {'id': 's1', 'name': 'Andheri'},
        'eta': {
          'durationText': '8 mins',
          'distanceText': '3.2 km',
          'estimatedArrival': '2026-06-21T07:53:00.000Z',
        },
      });
      expect(eta.durationText, '8 mins');
      expect(eta.stopName, 'Andheri');
    });
  });
}
