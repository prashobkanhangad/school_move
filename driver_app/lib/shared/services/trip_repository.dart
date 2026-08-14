import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../models/route_model.dart';
import '../models/trip_model.dart';
import 'auth_repository.dart';

class TripRepository {
  TripRepository(this._client);

  final ApiClient _client;

  Future<TripModel?> getActiveTrip() async {
    try {
      final response = await _client.dio.get('/trips/active');
      final data = response.data['data'];
      if (data == null) return null;
      return TripModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<TripModel> startTrip({required String routeId, required String busId}) async {
    try {
      final response = await _client.dio.post(
        '/trips/start',
        data: {'routeId': routeId, 'busId': busId},
      );
      return TripModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<TripModel> endTrip(String tripId) async {
    try {
      final response = await _client.dio.post('/trips/$tripId/end');
      return TripModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<void> sendEmergency({
    required String tripId,
    required double latitude,
    required double longitude,
    String? message,
  }) async {
    try {
      await _client.dio.post(
        '/trips/$tripId/emergency',
        data: {
          'latitude': latitude,
          'longitude': longitude,
          if (message != null && message.isNotEmpty) 'message': message,
        },
      );
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<List<RouteModel>> getRoutes({String? busId}) async {
    try {
      final response = await _client.dio.get(
        '/routes',
        queryParameters: {'page': 1, 'limit': 50, 'status': 'ACTIVE', if (busId != null) 'busId': busId},
      );
      final items = response.data['data']['items'] as List<dynamic>;
      return items.map((e) => RouteModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<List<BusModel>> getBuses() async {
    try {
      final response = await _client.dio.get('/buses', queryParameters: {'page': 1, 'limit': 100});
      final items = response.data['data']['items'] as List<dynamic>;
      return items.map((e) => BusModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }
}

final tripRepositoryProvider = Provider<TripRepository>(
  (ref) => TripRepository(ref.watch(apiClientProvider)),
);
