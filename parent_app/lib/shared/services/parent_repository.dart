import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../models/parent_models.dart';
import 'auth_repository.dart';

class ParentRepository {
  ParentRepository(this._client);

  final ApiClient _client;

  Future<List<ChildModel>> getMyChildren() async {
    try {
      final response = await _client.dio.get('/parents/me/children');
      final list = response.data['data'] as List<dynamic>;
      return list.map((e) => ChildModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<EtaModel> getEta(String tripId, {required String studentId}) async {
    try {
      final response = await _client.dio.get(
        '/trips/$tripId/eta',
        queryParameters: {'studentId': studentId},
      );
      return EtaModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<List<NotificationModel>> getNotifications({int page = 1}) async {
    try {
      final response = await _client.dio.get(
        '/notifications',
        queryParameters: {'page': page, 'limit': 50},
      );
      final items = response.data['data']['items'] as List<dynamic>;
      return items.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<void> markNotificationRead(String id) async {
    try {
      await _client.dio.patch('/notifications/$id/read');
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<void> markAllNotificationsRead() async {
    try {
      await _client.dio.patch('/notifications/read-all');
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }
}

final parentRepositoryProvider = Provider<ParentRepository>(
  (ref) => ParentRepository(ref.watch(apiClientProvider)),
);
