import 'package:firebase_admin_sdk/auth.dart';
import 'package:firebase_admin_sdk/firebase_admin_sdk.dart';
import 'package:firebase_functions/firebase_functions.dart' hide DecodedIdToken;
import 'package:google_cloud_firestore/google_cloud_firestore.dart';
import 'package:jaspr/dom.dart';
import 'package:jaspr/server.dart';
import '../lib/src/app_js.dart';

class MessageData {
  String text;

  MessageData({required this.text});

  factory MessageData.fromJson(Map<String, dynamic> json) {
    return MessageData(text: json['text'] as String? ?? 'Hello World!');
  }

  Map<String, dynamic> toJson() => {'text': text};
}

Future<MessageData> getMessage(DocumentReference ref) async {
  final snapshot = await ref.get();
  if (!snapshot.exists) {
    final defaultMessage = MessageData(text: 'Hello World!');
    await ref.set(defaultMessage.toJson());
    return defaultMessage;
  }
  return MessageData.fromJson(snapshot.data()!);
}

/// Extracts and verifies the `Authorization: Bearer <idToken>` header.
///
/// NOTE: This header-based authentication could potentially be replaced with native
/// cookie-based authentication using Firebase's `browserCookiePersistence` once that
/// graduates from Beta/Public Preview.
Future<DecodedIdToken?> verifyAuthHeader(
  Request request,
  FirebaseApp app,
) async {
  final authHeader = request.headers['authorization'];
  if (authHeader == null || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  // Strip 'Bearer ' prefix (7 characters)
  final idToken = authHeader.substring(7);
  try {
    return await app.auth().verifyIdToken(idToken);
  } catch (e) {
    return null;
  }
}

class BaseDocument extends StatelessComponent {
  final String titleText;
  final Component child;
  final bool showSignOut;

  const BaseDocument({
    required this.titleText,
    required this.child,
    this.showSignOut = true,
  });

  @override
  Component build(BuildContext context) {
    return Document(
      title: titleText,
      lang: 'en',
      head: [
        link(
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css',
        ),
        script(content: appJs, attributes: {'type': 'module'}),
      ],
      body: Component.fragment([
        nav([
          ul([
            li([
              strong([Component.text('Dart HTMX Demo')]),
            ]),
          ]),
          ul([
            if (showSignOut)
              li([
                button(
                  [Component.text('Sign Out')],
                  classes: 'secondary outline',
                  id: 'signout-button',
                  attributes: {'hx-get': '/contact'},
                ),
              ]),
          ]),
        ], classes: 'container-fluid'),
        main_([child], classes: 'container'),
      ]),
    );
  }
}

Component createDisplayView(MessageData msg) {
  return article([
    header([Component.text('Public Message')]),
    div([
      blockquote([Component.text(msg.text)]),
    ]),
    footer([
      button(
        [Component.text('Click To Edit')],
        classes: 'secondary',
        attributes: {
          'hx-get': '/contact?mode=edit',
          'hx-target': '#message-card',
          'hx-swap': 'outerHTML',
        },
      ),
    ]),
  ], id: 'message-card');
}

Component createEditView(MessageData msg) {
  return article([
    form(
      [
        header([Component.text('Edit Message')]),
        div([
          label([
            Component.text('Message Text'),
            input(
              type: InputType.text,
              name: 'text',
              value: msg.text,
              attributes: {'required': 'true'},
            ),
          ]),
        ]),
        footer([
          button(
            [Component.text('Cancel')],
            classes: 'secondary',
            type: ButtonType.button,
            attributes: {
              'hx-get': '/contact',
              'hx-target': '#message-card',
              'hx-swap': 'outerHTML',
            },
          ),
          button([Component.text('Save')], type: ButtonType.submit),
        ], classes: 'grid'),
      ],
      attributes: {
        'hx-put': '/contact',
        'hx-target': '#message-card',
        'hx-swap': 'outerHTML',
      },
    ),
  ], id: 'message-card');
}

Component createSignInView() {
  return article([
    header([Component.text('Sign In Required')]),
    form(
      [
        label([
          Component.text('Email'),
          input(
            type: InputType.email,
            id: 'email',
            name: 'email',
            attributes: {'required': 'true'},
          ),
        ]),
        label([
          Component.text('Password'),
          input(
            type: InputType.password,
            id: 'password',
            name: 'password',
            attributes: {'required': 'true'},
          ),
        ]),
        div(
          [],
          id: 'login-error',
          attributes: {
            'style':
                'color: var(--pico-form-element-invalid-border-color); margin-bottom: 1rem;',
          },
        ),
        button([Component.text('Sign In')], type: ButtonType.submit),
      ],
      id: 'signin-form',
      attributes: {'hx-post': '/contact'},
    ),
    footer([
      small([
        Component.text('Demo account: '),
        code([Component.text('test@example.com')]),
        Component.text(' / '),
        code([Component.text('Test@12345')]),
      ]),
    ]),
  ], id: 'signin-card');
}

void main() {
  Jaspr.initializeApp();
  final adminApp = FirebaseApp.initializeApp();

  runFunctions((firebase) {
    final firestore = Firestore();

    firebase.https.onRequest(name: 'contact', (request) async {
      final docRef = firestore.collection('messages').doc('message');
      final msg = await getMessage(docRef);

      final mode = request.url.queryParameters['mode'];
      final isHxRequest = request.headers['hx-request'] == 'true';

      if (request.method == 'GET') {
        if (mode == 'signin') {
          final signInView = createSignInView();
          final result = await renderComponent(
            isHxRequest
                ? signInView
                : BaseDocument(
                    titleText: 'Sign In',
                    child: signInView,
                    showSignOut: false,
                  ),
            request: request,
          );
          return Response.ok(
            result.body,
            headers: {'content-type': 'text/html'},
          );
        }

        if (mode == 'edit') {
          final decodedToken = await verifyAuthHeader(request, adminApp);
          if (decodedToken == null) {
            if (isHxRequest) {
              return Response(
                401,
                headers: {'HX-Redirect': '/contact?mode=signin'},
              );
            } else {
              return Response.found('/contact?mode=signin');
            }
          }

          final editView = createEditView(msg);
          final result = await renderComponent(
            isHxRequest
                ? editView
                : BaseDocument(titleText: 'Edit Message', child: editView),
            request: request,
          );
          return Response.ok(
            result.body,
            headers: {'content-type': 'text/html'},
          );
        } else {
          final displayView = createDisplayView(msg);
          final result = await renderComponent(
            isHxRequest
                ? displayView
                : BaseDocument(titleText: 'Public Message', child: displayView),
            request: request,
          );
          return Response.ok(
            result.body,
            headers: {'content-type': 'text/html'},
          );
        }
      } else if (request.method == 'PUT' || request.method == 'POST') {
        final decodedToken = await verifyAuthHeader(request, adminApp);
        if (decodedToken == null) {
          if (isHxRequest) {
            return Response(
              401,
              headers: {'HX-Redirect': '/contact?mode=signin'},
            );
          } else {
            return Response.found('/contact?mode=signin');
          }
        }

        final bodyStr = await request.readAsString();
        final formData = Uri.splitQueryString(bodyStr);

        msg.text = formData['text'] ?? msg.text;

        await docRef.set(msg.toJson());

        final displayView = createDisplayView(msg);
        final result = await renderComponent(
          isHxRequest
              ? displayView
              : BaseDocument(titleText: 'Public Message', child: displayView),
          request: request,
        );
        return Response.ok(result.body, headers: {'content-type': 'text/html'});
      }

      return Response(405, body: 'Method Not Allowed');
    });
  });
}
