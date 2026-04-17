import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants.dart';

class AboutPopup extends StatelessWidget {
  const AboutPopup({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(spaceSize * 2),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: maxContentWidth),
        child: Container(
          padding: const EdgeInsets.all(doubleSpaceSize),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: colorScheme.outlineVariant),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: colorScheme.primary,
                    size: 28,
                  ),
                  const SizedBox(width: spaceSize),
                  Expanded(
                    child: Text(
                      'About $appTitle',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                    tooltip: 'Close',
                  ),
                ],
              ),
              const SizedBox(height: doubleSpaceSize),
              Text(
                'This is a demo application showcasing the '
                'integration of Flutter, Firebase, and Dart.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: spaceSize),
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(text: 'Source Code: '),
                    TextSpan(
                      text: githubDisplayUrl,
                      style: TextStyle(
                        color: colorScheme.primary,
                        decoration: TextDecoration.underline,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => launchUrl(githubUri),
                    ),
                  ],
                ),
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: doubleSpaceSize),
              Container(
                padding: const EdgeInsets.all(spaceSize),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.5,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.privacy_tip_outlined,
                      color: colorScheme.secondary,
                    ),
                    const SizedBox(width: spaceSize),
                    Expanded(
                      child: Text(
                        "Privacy: I won't do anything weird with your email. "
                        'Promise.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
