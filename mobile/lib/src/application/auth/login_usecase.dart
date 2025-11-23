import '../../domain/entities/auth_token.dart';
import '../../domain/entities/user_credentials.dart';
import '../../domain/repositories/auth_repository.dart';

class LoginUseCase {
  final AuthRepository repository;

  LoginUseCase(this.repository);

  Future<AuthToken> execute(String email, String password) async {
    final credentials = UserCredentials(email: email, password: password);
    return await repository.login(credentials);
  }
}