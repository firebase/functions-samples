# Back up images using a Task Queue Function (v2)
This quickstart demonstrates how to setup a Task Queue Function using the Firebase SDK for Cloud Functions (v2).

## Introduction

Task queue functions make it easy to manage the execution, dispatch, and delivery of a large number of distributed tasks.

We leverage its power here to set up a service that backs up all images from NASA's [Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html).

Task queue functions are powered by [Google Cloud Tasks](https://cloud.google.com/tasks). Learn more about [task queue functions](https://firebase.google.com/docs/functions/beta/task-functions).

## Functions
The sample code consists of 2 functions:

### 1. `backupapod`
A task queue function responsible for processing the logic for backing up the Astronomy Picture of the Day ("apod") for the given date. This function will be triggered for every task enqueued on the corresponding queue created in Cloud Tasks.

Task queue functions come with a powerful set of configuration to precisely control rate limits and retry behavior of a task queue. [See the documentation](https://cloud.google.com/tasks/docs/creating-queues) to learn more about configuring task queue functions.

Our sample make use of following configurations:

1) `retryConfig.maxAttempts=5` - Each task in our task queue will be automatically retried upto 5 times. This helps us mitigate transient errors like network errors or temporary service disruption of a dependent, external service.
2) `retryConfig.minBackoffSeconds=60` - Each task will be retried at least 60 seconds apart from each attempt. This gives us a large buffer between each attempt so we don't rush to exhaust our 5 retry attempts too quickly.
3) `rateLimits.maxConcurrentDispatch` - At most 6 tasks will be dispatched at a given time. At most 6 tasks will be dispatched at a given time. This helps ensure a steady stream of requests to the underlying function and helps reduce the number of active instances and cold starts.

You can further configure this function with following [environment variables](https://firebase.google.com/docs/functions/config-env):

* `BACKUP_BUCKET`: Name of the bucket to back up "apod" images. Defaults to default Cloud Storage bucket.

### 2. `enqueuebackuptasks`
An HTTP function responsible for enqueuing tasks to our task queue. The function uses the Firebase Admin SDK to create and enqueue a task for each day we want to backup an "apod" image.

You can configure this function with following [environment variables](https://firebase.google.com/docs/functions/config-env):

* `BACKUP_COUNT`: Number of days to back up Astronomy Picture of the Day, starting from 1995-06-17 (the first day of publication). Defaults to 100.

* `HOURLY_BATCH_SIZE`: Number of tasks to enqueue at each hour. Note that NASA API imposes a limit of 1000 reqs/hour. Defaults to 500.

## Setup and Deploy

### NASA Open API Key
The sample uses [NASA Open APIs](https://api.nasa.gov/) to retrieve Astronomy Picture of the Day  images. You need to register for an account to get your API Key and hook it up the task queue function by [creating a secret](https://firebase.google.com/docs/functions/config-env#secret-manager):

```bash
$ firebase functions:secrets:set NASA_API_KEY
? Enter a value for NASA_API_KEY [input is hidden]
✔  Created a new secret version projects/XXX/secrets/NASA_API_KEY/versions/1
```

### Deploy
Deploy functions using Firebase CLI:

```bash
$ firebase deploy
```

## IAM Policy

The sample declares the IAM roles it needs in `functions/index.js`: `requiresRole("roles/cloudtasks.enqueuer")` and `requiresRole("roles/run.invoker")`. When you deploy, the Firebase CLI creates a service account for this codebase (its email starts with `firebase-fn-`), grants it those roles, and runs every function in the codebase as that account. The CLI prints the account's email when it creates it; you can also find it under **IAM & Admin > Service accounts** in the Google Cloud console. The commands below call it `${FUNCTIONS_SA}`.

Cloud Tasks needs three bindings in total. `requiresRole` covers the first and third; you add the second by hand.

* The identity that enqueues tasks needs `cloudtasks.tasks.create` (`roles/cloudtasks.enqueuer`). `requiresRole` grants it. To grant it yourself:

```
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${FUNCTIONS_SA} \
  --role=roles/cloudtasks.enqueuer
```

* The identity that enqueues tasks needs permission to act as the service account that Cloud Tasks uses to call the task queue function (`roles/iam.serviceAccountUser` on that service account). In this sample both are `${FUNCTIONS_SA}`, so the account needs the role on itself. `requiresRole` doesn't cover this one:

```
gcloud iam service-accounts add-iam-policy-binding ${FUNCTIONS_SA} \
  --member=serviceAccount:${FUNCTIONS_SA} \
  --role=roles/iam.serviceAccountUser
```

* The identity that Cloud Tasks uses to call the task queue function needs `run.routes.invoke` (`roles/run.invoker`). `requiresRole` grants it. To grant it yourself:

```
gcloud functions add-iam-policy-binding backupapod \
  --region=us-central1 \
  --member=serviceAccount:${FUNCTIONS_SA} \
  --role=roles/run.invoker
```

If you remove the `requiresRole` calls, the functions run as the [Compute Engine default service account](https://cloud.google.com/compute/docs/access/service-accounts) (`${PROJECT_NUMBER}-compute@developer.gserviceaccount.com`) instead. Use that email in the commands above and run all three.

If tasks fail with `401` or `403` (`PERMISSION_DENIED`) in the Cloud Tasks logs, check that the `roles/run.invoker` binding above exists. Cloud Tasks mints an OIDC token for the function's URL, and Cloud Run rejects the call if the token's service account can't invoke the function. If `enqueue` itself fails with `PERMISSION_DENIED`, the missing `roles/iam.serviceAccountUser` binding is the usual cause.

The sample deploys to `us-central1`, which is the region `getFunctions().taskQueue("backupapod")` assumes when you pass a bare function name. If you deploy the function to another region, pass the full resource name instead: `taskQueue("locations/europe-west1/functions/backupapod")`.