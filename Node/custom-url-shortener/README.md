# Custom shortlinks with Firestore and Firebase Hosting

1. Write a document to the `links` collection in Firestore to create a new shortLink:
   ```
   {
       longUrl: "https://firebase.google.com"
   }
   ```
1. View the available shortlinks at the `/links` path on your Hosting site
1. Visit a shortlink's path on your hosting site `https://<your-site>/<shortlink>` to be redirected!
