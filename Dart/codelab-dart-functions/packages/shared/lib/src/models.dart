import 'package:json_annotation/json_annotation.dart';

part 'models.g.dart';

@JsonSerializable()
class IncrementResponse {
  final bool success;
  final String? message;
  final int? newCount;

  const IncrementResponse({required this.success, this.message, this.newCount});

  factory IncrementResponse.fromJson(Map<String, dynamic> json) =>
      _$IncrementResponseFromJson(json);

  Map<String, dynamic> toJson() => _$IncrementResponseToJson(this);
}

// Store the function name as a constant to ensure consistency between client and server.
const incrementCallable = 'increment';
