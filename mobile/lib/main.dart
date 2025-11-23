import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import 'src/application/auth/login_usecase.dart';
import 'src/data/repositories_impl/auth_repository_impl.dart';
import 'src/presentation/login/login_page.dart';

void main() {
  final dio = Dio(BaseOptions(baseUrl: "https://suaapi.com"));
  final authRepo = AuthRepositoryImpl(dio);
  final loginUseCase = LoginUseCase(authRepo);

  runApp(
    MaterialApp(
      title: 'MJCP Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: LoginPage(loginUseCase: loginUseCase),
    ),
  );
}
