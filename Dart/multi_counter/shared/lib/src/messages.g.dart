// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'messages.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

IncrementResponse _$IncrementResponseFromJson(Map<String, dynamic> json) =>
    IncrementResponse(
      success: json['success'] as bool,
      message: json['message'] as String?,
    );

Map<String, dynamic> _$IncrementResponseToJson(IncrementResponse instance) =>
    <String, dynamic>{'success': instance.success, 'message': instance.message};
