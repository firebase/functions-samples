import 'dart:async';

import 'package:flutter/material.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';

import '../../constants.dart';
import '../../widgets/app_scaffold.dart';
import 'state.dart';

class CounterScreen extends StatefulWidget {
  const CounterScreen({super.key});

  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  final state = CounterState();
  late final StreamSubscription<IncrementResponse> _sub;

  @override
  void initState() {
    super.initState();

    ScaffoldFeatureController<SnackBar, SnackBarClosedReason>?
    snackBarController;

    _sub = state.incrementResponseStream.listen((response) {
      if (!mounted) return;

      final message = response.message;
      if (message != null && snackBarController == null) {
        snackBarController = ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: response.success ? null : Colors.red,
          ),
        );

        snackBarController?.closed.then((reason) {
          snackBarController = null;
        });
      }
    });
  }

  @override
  void dispose() {
    _sub.cancel();
    state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AppScaffold(
    child: ListenableBuilder(
      listenable: state,
      builder: (context, child) {
        final globalCount = state.globalCounter;
        return SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                appTitle,
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              _spacer,
              const Text('You have pushed the button this many times:'),
              Text(
                '${state.userCounter}',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              _spacer,
              if (globalCount == null) const Text('...'),
              if (globalCount != null) ...[
                const Text('Total button pushes:'),
                Text(
                  '${globalCount.totalClicks}',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                _spacer,
                const Text('Total people who have pushed the button:'),
                Text(
                  '${globalCount.totalUsers}',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ],
              _spacer,
              FloatingActionButton.extended(
                onPressed: state.isLoading ? null : state.increment,
                tooltip: 'Increment',
                icon: state.isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.add),
                label: const Text('Increment'),
              ),
            ],
          ),
        );
      },
    ),
  );
}

const _spacer = SizedBox(height: doubleSpaceSize);
