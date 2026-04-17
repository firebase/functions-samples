import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/config_state.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await initializeWorld();

  runApp(const MyApp());
}
