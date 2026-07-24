import 'package:flutter/material.dart';

import '../constants.dart';

class CenteredPremiumCard extends StatelessWidget {
  final Widget child;
  final bool useGradient;
  final EdgeInsetsGeometry padding;
  final double? maxWidth;

  const CenteredPremiumCard({
    super.key,
    required this.child,
    this.useGradient = false,
    this.padding = const EdgeInsets.all(doubleSpaceSize),
    this.maxWidth,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(spaceSize),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth ?? maxContentWidth),
          child: Container(
            decoration: BoxDecoration(
              color: useGradient ? null : colorScheme.surface,
              gradient: useGradient
                  ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        colorScheme.surface,
                        colorScheme.surfaceContainerHighest.withValues(
                          alpha: 0.5,
                        ),
                      ],
                    )
                  : null,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
              border: Border.all(color: colorScheme.outlineVariant),
            ),
            child: Padding(padding: padding, child: child),
          ),
        ),
      ),
    );
  }
}
