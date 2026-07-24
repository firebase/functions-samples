# Firestore layout

```
users/{userId}
  count: Integer

global/vars
  totalCount: Integer
```

**TODO**: Put these in a shared Dart file to ensure they stay in sync with the code.



## Security Rules


**TODO**: Implement/deploy these rules!

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow authenticated users to only read global data
    match /global/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

