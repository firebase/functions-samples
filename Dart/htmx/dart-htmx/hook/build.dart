import 'dart:io';
import 'package:hooks/hooks.dart';

void main(List<String> args) async {
  await build(args, (input, output) async {
    print('Running npm install in web/...');
    final npmResult = Process.runSync(
      'npx',
      ['npm', 'install'],
      workingDirectory: 'web',
      runInShell: true,
    );
    if (npmResult.exitCode != 0) {
      throw BuildError(
        message:
            'Error running npm install:\n${npmResult.stdout}\n${npmResult.stderr}',
      );
    }

    print('Running npm run build (esbuild) in web/...');
    final buildResult = Process.runSync(
      'npx',
      ['npm', 'run', 'build'],
      workingDirectory: 'web',
      runInShell: true,
    );
    if (buildResult.exitCode != 0) {
      throw BuildError(
        message:
            'Error running npm run build:\n${buildResult.stdout}\n${buildResult.stderr}',
      );
    }

    final jsFile = File('web/dist/app.bundle.js');
    if (!jsFile.existsSync()) {
      throw BuildError(
        message: 'Error: web/dist/app.bundle.js does not exist after build.',
      );
    }

    final jsContent = jsFile.readAsStringSync();

    final dartContent =
        '''
// Generated file. Do not edit.
// Bundled from web/dist/app.bundle.js

const String appJs = r\'\'\'
$jsContent\'\'\';
''';

    final outputDir = Directory('lib/src');
    if (!outputDir.existsSync()) {
      outputDir.createSync(recursive: true);
    }

    final dartFile = File('lib/src/app_js.dart');
    dartFile.writeAsStringSync(dartContent);
    print(
      'Successfully bundled web/dist/app.bundle.js into lib/src/app_js.dart',
    );

    output.dependencies.add(Uri.file('web/app.ts'));
    output.dependencies.add(Uri.file('web/package.json'));
  });
}
