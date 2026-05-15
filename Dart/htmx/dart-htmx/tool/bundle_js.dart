import 'dart:io';

void main() {
  final jsFile = File('web/app.js');
  if (!jsFile.existsSync()) {
    print('Error: web/app.js does not exist. Run tsc first.');
    exit(1);
  }

  final jsContent = jsFile.readAsStringSync();

  final dartContent =
      '''
// Generated file. Do not edit.
// Bundled from web/app.js

const String appJs = r\'\'\'
$jsContent\'\'\';
''';

  final outputDir = Directory('lib/src');
  if (!outputDir.existsSync()) {
    outputDir.createSync(recursive: true);
  }

  final dartFile = File('lib/src/app_js.dart');
  dartFile.writeAsStringSync(dartContent);
  print('Successfully bundled web/app.js into lib/src/app_js.dart');
}
