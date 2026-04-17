import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart' hide EmailAuthProvider;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/counter/screen.dart';
import 'screens/login.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const CounterScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
  ],
  redirect: (context, state) async {
    // Ensure we capture the redirect result before checking the auth state.
    await FirebaseAuth.instance.getRedirectResult();

    final loggedIn = FirebaseAuth.instance.currentUser != null;
    final loggingIn = state.matchedLocation == '/login';

    if (!loggedIn) return '/login';
    if (loggingIn) return '/';

    return null;
  },
  refreshListenable: GoRouterRefreshStream(
    FirebaseAuth.instance.authStateChanges(),
  ),
);

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
      (dynamic _) => notifyListeners(),
    );
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
