import 'dart:convert';
import 'package:firebase_functions/firebase_functions.dart';
import 'package:google_cloud_firestore/google_cloud_firestore.dart';
import 'package:html/dom.dart' as html;

class Contact {
  String firstName;
  String lastName;
  String email;

  Contact({required this.firstName, required this.lastName, required this.email});

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
    final defaultContact = Contact(firstName: 'Joe', lastName: 'Blow', email: 'joe@blow.com');
    await ref.set(defaultContact.toJson());
    return defaultContact;
  }
  return Contact.fromJson(snapshot.data()!);
}

html.Document createBaseDocument(String titleText, html.Element content) {
  final doc = html.Document();
  final htmlNode = html.Element.tag('html')..attributes['lang'] = 'en';
  doc.append(htmlNode);

  final head = html.Element.tag('head');
  htmlNode.append(head);
  
  head.append(html.Element.tag('meta')..attributes['charset'] = 'utf-8');
  head.append(html.Element.tag('meta')..attributes['name'] = 'viewport'..attributes['content'] = 'width=device-width, initial-scale=1');
  head.append(html.Element.tag('title')..text = titleText);
  head.append(html.Element.tag('link')..attributes['rel'] = 'stylesheet'..attributes['href'] = 'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css');
  head.append(html.Element.tag('script')..attributes['src'] = 'https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta3'..attributes['crossorigin'] = 'anonymous');

  final body = html.Element.tag('body');
  htmlNode.append(body);
  
  final main = html.Element.tag('main')..attributes['class'] = 'container';
  body.append(main);
  main.append(content);

  return doc;
}

html.Element createDisplayView(Contact contact) {
  final article = html.Element.tag('article')..attributes['id'] = 'contact-card';
  
  final header = html.Element.tag('header')..text = 'Contact Info';
  article.append(header);

  final grid = html.Element.tag('div')..attributes['class'] = 'grid';
  article.append(grid);

  final col1 = html.Element.tag('div');
  grid.append(col1);
  col1.append(html.Element.tag('strong')..text = 'First Name: ');
  col1.append(html.Text(contact.firstName));

  final col2 = html.Element.tag('div');
  grid.append(col2);
  col2.append(html.Element.tag('strong')..text = 'Last Name: ');
  col2.append(html.Text(contact.lastName));

  final col3 = html.Element.tag('div');
  grid.append(col3);
  col3.append(html.Element.tag('strong')..text = 'Email: ');
  col3.append(html.Text(contact.email));

  final footer = html.Element.tag('footer');
  article.append(footer);

  final editBtn = html.Element.tag('button')
    ..attributes['hx-get'] = '?mode=edit'
    ..attributes['hx-target'] = '#contact-card'
    ..attributes['hx-swap'] = 'outerHTML'
    ..attributes['class'] = 'secondary'
    ..text = 'Click To Edit';
  footer.append(editBtn);

  return article;
}

html.Element createEditView(Contact contact) {
  final article = html.Element.tag('article')..attributes['id'] = 'contact-card';
  
  final form = html.Element.tag('form')
    ..attributes['hx-put'] = '?'
    ..attributes['hx-target'] = '#contact-card'
    ..attributes['hx-swap'] = 'outerHTML';
  article.append(form);

  final header = html.Element.tag('header')..text = 'Edit Contact';
  form.append(header);

  final grid = html.Element.tag('div')..attributes['class'] = 'grid';
  form.append(grid);

  final label1 = html.Element.tag('label')..text = 'First Name';
  grid.append(label1);
  label1.append(html.Element.tag('input')..attributes['type'] = 'text'..attributes['name'] = 'firstName'..attributes['value'] = contact.firstName);

  final label2 = html.Element.tag('label')..text = 'Last Name';
  grid.append(label2);
  label2.append(html.Element.tag('input')..attributes['type'] = 'text'..attributes['name'] = 'lastName'..attributes['value'] = contact.lastName);

  final label3 = html.Element.tag('label')..text = 'Email';
  form.append(label3);
  label3.append(html.Element.tag('input')..attributes['type'] = 'email'..attributes['name'] = 'email'..attributes['value'] = contact.email);

  final footer = html.Element.tag('footer')..attributes['class'] = 'grid';
  form.append(footer);

  final cancelBtn = html.Element.tag('button')
    ..attributes['type'] = 'button'
    ..attributes['hx-get'] = '?'
    ..attributes['hx-target'] = '#contact-card'
    ..attributes['hx-swap'] = 'outerHTML'
    ..attributes['class'] = 'secondary'
    ..text = 'Cancel';
  footer.append(cancelBtn);

  final saveBtn = html.Element.tag('button')..attributes['type'] = 'submit'..text = 'Save';
  footer.append(saveBtn);

  return article;
}

void main(List<String> args) {
  fireUp(args, (firebase) {
    final firestore = Firestore();

    firebase.https.onRequest(
      name: 'contact',
      (request) async {
        final docRef = firestore.collection('contacts').doc('1');
        final contact = await getContact(docRef);

        final mode = request.url.queryParameters['mode'];
        final isHxRequest = request.headers['hx-request'] == 'true';

        if (request.method == 'GET') {
          if (mode == 'edit') {
            final editView = createEditView(contact);
            final htmlStr = isHxRequest ? editView.outerHtml : createBaseDocument('Edit Contact', editView).outerHtml;
            return Response(200, body: htmlStr, headers: {'Content-Type': 'text/html'});
          } else {
            final displayView = createDisplayView(contact);
            final htmlStr = isHxRequest ? displayView.outerHtml : createBaseDocument('Contact', displayView).outerHtml;
            return Response(200, body: htmlStr, headers: {'Content-Type': 'text/html'});
          }
        } else if (request.method == 'PUT' || request.method == 'POST') {
          final bodyStr = await request.readAsString();
          final formData = Uri.splitQueryString(bodyStr);
          
          contact.firstName = formData['firstName'] ?? contact.firstName;
          contact.lastName = formData['lastName'] ?? contact.lastName;
          contact.email = formData['email'] ?? contact.email;
          
          await docRef.set(contact.toJson());

          final displayView = createDisplayView(contact);
          final htmlStr = isHxRequest ? displayView.outerHtml : createBaseDocument('Contact', displayView).outerHtml;
          return Response(200, body: htmlStr, headers: {'Content-Type': 'text/html'});
        }

        return Response(405, body: 'Method Not Allowed');
      },
    );
  });
}
