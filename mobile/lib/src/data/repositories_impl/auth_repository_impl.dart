import 'package:dio/dio.dart';
import '../../domain/entities/auth_token.dart';
import '../../domain/entities/user_credentials.dart';
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final Dio http;

  AuthRepositoryImpl(this.http);

  @override
  Future<AuthToken> login(UserCredentials credentials) async {
    final response = await http.post(
      '/login',
      data: {
        'email': credentials.email,
        'password': credentials.password,
      },
    );

    return AuthToken(response.data['token']);
  }
}
