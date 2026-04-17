import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../constants.dart';
import 'about_popup.dart';
import 'centered_premium_card.dart';

class AppScaffold extends StatelessWidget {
  final Widget child;
  final String? title;
  final bool useCardGradient;

  const AppScaffold({
    super.key,
    required this.child,
    this.title,
    this.useCardGradient = false,
  });

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 370 || size.height < 650;

    if (isSmall) {
      return _buildSmallLayout(context, user);
    }

    return _buildLargeLayout(context, user);
  }

  Widget _buildSmallLayout(BuildContext context, User? user) => Scaffold(
    body: SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            vertical: spaceSize / 2,
            horizontal: spaceSize / 2,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Content
              child,

              const SizedBox(height: doubleSpaceSize),

              // About
              TextButton.icon(
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (context) => const AboutPopup(),
                ),
                icon: const Icon(Icons.info_outline),
                label: const Text('About'),
              ),

              // User info
              if (user != null) ...[
                const SizedBox(height: spaceSize),
                Text(
                  user.email ?? '',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: spaceSize / 2),
                IconButton(
                  icon: const Icon(Icons.logout),
                  onPressed: () => FirebaseAuth.instance.signOut(),
                ),
              ],
            ],
          ),
        ),
      ),
    ),
  );

  Widget _buildLargeLayout(BuildContext context, User? user) => Scaffold(
    body: CenteredPremiumCard(useGradient: useCardGradient, child: child),
    bottomNavigationBar: SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: spaceSize,
          vertical: spaceSize / 2,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextButton.icon(
                  onPressed: () => showDialog<void>(
                    context: context,
                    builder: (context) => const AboutPopup(),
                  ),
                  icon: const Icon(Icons.info_outline),
                  label: const Text('About'),
                ),
                if (user != null) ...[
                  const SizedBox(width: spaceSize),
                  Expanded(
                    child: Text(
                      user.email ?? '',
                      style: Theme.of(context).textTheme.bodyMedium,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.end,
                    ),
                  ),
                  const SizedBox(width: spaceSize / 2),
                  IconButton(
                    icon: const Icon(Icons.logout),
                    onPressed: () => FirebaseAuth.instance.signOut(),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    ),
  );
}
