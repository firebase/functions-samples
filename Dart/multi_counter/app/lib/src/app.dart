import 'package:flutter/material.dart';

import 'router.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp.router(
    debugShowCheckedModeBanner: false,
    title: 'Flutter Demo',
    routerConfig: router,
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF18181B), // Zinc 900
        secondary: Color(0xFF3F3F46), // Zinc 700
        onSecondary: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF18181B),
        elevation: 0,
      ),
    ),
    darkTheme: ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFFFAFAFA), // Zinc 50
        secondary: Color(0xFFD4D4D8), // Zinc 300
        surface: Color(0xFF09090B), // Zinc 950
        onPrimary: Color(0xFF18181B),
        onSecondary: Color(0xFF18181B),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF09090B),
        foregroundColor: Color(0xFFFAFAFA),
        elevation: 0,
      ),
    ),
  );
}
