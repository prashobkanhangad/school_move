import 'dart:async';
import 'dart:io' show Platform;

import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationService {
  Future<bool> ensurePermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      await openAppSettings();
      return false;
    }

    if (!Platform.isAndroid && permission == LocationPermission.whileInUse) {
      await Permission.locationAlways.request();
    }

    if (Platform.isAndroid) {
      await Permission.notification.request();
    }

    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<Position?> getCurrentPosition() async {
    final granted = await ensurePermission();
    if (!granted) return null;

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  LocationSettings trackingSettings() {
    if (Platform.isAndroid) {
      return AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
        // Do not set timeLimit — Geolocator closes the stream on timeout.
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'SchoolMove trip active',
          notificationText: 'Sharing live bus location with the school and parents',
          enableWakeLock: true,
          setOngoing: true,
        ),
      );
    }
    return AppleSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
      activityType: ActivityType.automotiveNavigation,
      allowBackgroundLocationUpdates: true,
      showBackgroundLocationIndicator: true,
    );
  }

  Stream<Position> positionStream() {
    return Geolocator.getPositionStream(locationSettings: trackingSettings());
  }
}
