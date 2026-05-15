import 'dart:convert';
import 'package:firebase_admin_sdk/auth.dart';
import 'package:firebase_admin_sdk/firebase_admin_sdk.dart';
import 'package:firebase_functions/firebase_functions.dart' hide DecodedIdToken;
import 'package:google_cloud_firestore/google_cloud_firestore.dart';
import '../lib/src/app_js.dart';

class Contact {
  String firstName;
  String lastName;
  String email;

  Contact({
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      firstName: json['firstName'] as String? ?? 'Joe',
      lastName: json['lastName'] as String? ?? 'Blow',
      email: json['email'] as String? ?? 'joe@blow.com',
    );
  }

  Map<String, dynamic> toJson() => {
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
  };
}

Future<Contact> getContact(DocumentReference ref) async {
  final snapshot = await ref.get();
  if (!snapshot.exists) {
    final defaultContact = Contact(
      firstName: 'Joe',
      lastName: 'Blow',
      email: 'joe@blow.com',
    );
    await ref.set(defaultContact.toJson());
    return defaultContact;
  }
  return Contact.fromJson(snapshot.data()!);
}

Future<DecodedIdToken?> verifyAuthHeader(
  Request request,
  FirebaseApp app,
) async {
  final authHeader = request.headers['authorization'];
  if (authHeader == null || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  final idToken = authHeader.substring(7);
  try {
    return await app.auth().verifyIdToken(idToken);
  } catch (e) {
    return null;
  }
}

String createBaseDocument(
  String titleText,
  String content, {
  bool showSignOut = true,
}) =>
    '''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${const HtmlEscape().convert(titleText)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta3" crossorigin="anonymous"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script>$appJs</script>
</head>
<body>
  <nav class="container-fluid">
    <ul>
      <li><strong>Dart HTMX Demo</strong></li>
    </ul>
    <ul>
      ${showSignOut ? '<li><button onclick="signOut()" class="secondary outline">Sign Out</button></li>' : ''}
    </ul>
  </nav>
  <main class="container">
    $content
  </main>
</body>
</html>
''';

String createDisplayView(Contact contact) =>
    '''
<article id="contact-card">
  <header>Contact Info</header>
  <div class="grid">
    <div><strong>First Name: </strong>${const HtmlEscape().convert(contact.firstName)}</div>
    <div><strong>Last Name: </strong>${const HtmlEscape().convert(contact.lastName)}</div>
    <div><strong>Email: </strong>${const HtmlEscape().convert(contact.email)}</div>
  </div>
  <footer>
    <button hx-get="?mode=edit" hx-target="#contact-card" hx-swap="outerHTML" class="secondary">
      Click To Edit
    </button>
  </footer>
</article>
''';

String createEditView(Contact contact) =>
    '''
<article id="contact-card">
  <form hx-put="?" hx-target="#contact-card" hx-swap="outerHTML">
    <header>Edit Contact</header>
    <div class="grid">
      <label>
        First Name
        <input type="text" name="firstName" value="${const HtmlEscape().convert(contact.firstName)}">
      </label>
      <label>
        Last Name
        <input type="text" name="lastName" value="${const HtmlEscape().convert(contact.lastName)}">
      </label>
    </div>
    <label>
      Email
      <input type="email" name="email" value="${const HtmlEscape().convert(contact.email)}">
    </label>
    <footer class="grid">
      <button type="button" hx-get="?" hx-target="#contact-card" hx-swap="outerHTML" class="secondary">
        Cancel
      </button>
      <button type="submit">Save</button>
    </footer>
  </form>
</article>
''';

String createSignInView() => '''
<article id="signin-card">
  <header>Sign In Required</header>
  <form id="signin-form" onsubmit="signInWithEmailPassword(event)">
    <label>
      Email
      <input type="email" id="email" required>
    </label>
    <label>
      Password
      <input type="password" id="password" required>
    </label>
    <div id="login-error" style="color: var(--pico-form-element-invalid-border-color); margin-bottom: 1rem;"></div>
    <button type="submit">Sign In</button>
  </form>
  <footer>
    <small>Demo account: <code>test@example.com</code> / <code>Test@12345</code></small>
  </footer>
</article>
''';

void main() {
  final adminApp = FirebaseApp.initializeApp();

  runFunctions((firebase) {
    final firestore = Firestore();

    firebase.https.onRequest(name: 'contact', (request) async {
      final docRef = firestore.collection('contacts').doc('1');
      final contact = await getContact(docRef);

      final mode = request.url.queryParameters['mode'];
      final isHxRequest = request.headers['hx-request'] == 'true';

      if (request.method == 'GET') {
        if (mode == 'signin') {
          final signInView = createSignInView();
          final htmlStr = isHxRequest
              ? signInView
              : createBaseDocument('Sign In', signInView, showSignOut: false);
          return Response.ok(htmlStr, headers: {'content-type': 'text/html'});
        }

        if (mode == 'edit') {
          final decodedToken = await verifyAuthHeader(request, adminApp);
          if (decodedToken == null) {
            if (isHxRequest) {
              return Response(401, headers: {'HX-Redirect': '?mode=signin'});
            } else {
              return Response.found('?mode=signin');
            }
          }

          final editView = createEditView(contact);
          final htmlStr = isHxRequest
              ? editView
              : createBaseDocument('Edit Contact', editView);
          return Response.ok(htmlStr, headers: {'content-type': 'text/html'});
        } else {
          final displayView = createDisplayView(contact);
          final htmlStr = isHxRequest
              ? displayView
              : createBaseDocument('Contact', displayView);
          return Response.ok(htmlStr, headers: {'content-type': 'text/html'});
        }
      } else if (request.method == 'PUT' || request.method == 'POST') {
        final decodedToken = await verifyAuthHeader(request, adminApp);
        if (decodedToken == null) {
          if (isHxRequest) {
            return Response(401, headers: {'HX-Redirect': '?mode=signin'});
          } else {
            return Response.found('?mode=signin');
          }
        }

        final bodyStr = await request.readAsString();
        final formData = Uri.splitQueryString(bodyStr);

        contact.firstName = formData['firstName'] ?? contact.firstName;
        contact.lastName = formData['lastName'] ?? contact.lastName;
        contact.email = formData['email'] ?? contact.email;

        await docRef.set(contact.toJson());

        final displayView = createDisplayView(contact);
        final htmlStr = isHxRequest
            ? displayView
            : createBaseDocument('Contact', displayView);
        return Response.ok(htmlStr, headers: {'content-type': 'text/html'});
      }

      return Response(405, body: 'Method Not Allowed');
    });
  });
}
