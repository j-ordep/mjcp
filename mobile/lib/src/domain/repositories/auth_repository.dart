import '../entities/auth_token.dart';
import '../entities/user_credentials.dart';

abstract class AuthRepository {
  Future<AuthToken> login(UserCredentials credentials);
}
