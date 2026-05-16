import 'package:json_annotation/json_annotation.dart';

part 'messages.g.dart';

@JsonSerializable()
class IncrementResponse {
  final bool success;
  final String? message;

  const IncrementResponse({required this.success, this.message});

  factory IncrementResponse.success() => const IncrementResponse(success: true);

  factory IncrementResponse.failure(String message) =>
      IncrementResponse(success: false, message: message);

  factory IncrementResponse.fromJson(Map<String, dynamic> json) =>
      _$IncrementResponseFromJson(json);

  Map<String, dynamic> toJson() => _$IncrementResponseToJson(this);
}
