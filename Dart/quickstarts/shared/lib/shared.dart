class IncrementResponse {
  final bool success;
  final String message;
  final int newCount;

  const IncrementResponse({
    required this.success,
    required this.message,
    required this.newCount,
  });

  Map<String, dynamic> toJson() => {
    'success': success,
    'message': message,
    'newCount': newCount,
  };
}

const String incrementCallable = 'incrementSynced';
