import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared/shared.dart';

/// Get from emulator output when running or when deploying:
/// ✔ functions[us-central1-increment]: http function initialized
///  (http://127.0.0.1:5001/demo-no-project/us-central1/increment).
const incrementUrl = 'FIREBASE_FUNCTIONS_URL_HERE';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
        home: const CounterPage(),
      );
}

class CounterPage extends StatefulWidget {
  const CounterPage({super.key});
  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  int _count = 0;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    // Fetch the current count
    _increment(readOnly: true).ignore();
  }

  Future<void> _increment({bool readOnly = false}) async {
    setState(() => _loading = true);
    try {
      // Call the Dart function.
      final uri = Uri.parse(incrementUrl);
      final response = readOnly ? await http.get(uri) : await http.post(uri);

      // Parse the response back into the shared Dart object.
      final responseData = jsonDecode(response.body);
      final incrementResponse = IncrementResponse.fromJson(responseData);

      if (incrementResponse.success) {
        setState(() => _count = incrementResponse.newCount ?? _count);
      }
    } catch (e) {
      if (kDebugMode) {
        print("Error calling function: $e");
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Multiplayer Counter')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('You have pushed the button this many times:'),
            Text(
              '$_count',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loading ? null : _increment,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
