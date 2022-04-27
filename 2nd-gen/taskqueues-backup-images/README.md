# Quickstart: Back up images using a Task Queue Function
This quickstart demonstrates how to setup a Task Queue Function using the Firebase SDK for Cloud Functions.

## Introduction

Task queue functions make it easy to manage the execution, dispatch, and delivery of a large number of distributed tasks.

We leverage its power here to set up a service that backs up all images from NASA's [Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html).

Task queue functions are powered by [Google Cloud Tasks](https://cloud.google.com/tasks). Learn more about the tasks queues functions at TODO.

## Functions
The sample code consists of 2 functions:

### 1. `backupapod`
A task queue function responsible for processing the logic to backing up the Astronomy Picture of the Day ("apod") for the given date. This function will be triggered for every tasks enqueued on the corresponding queue created in Cloud Tasks.

You can configure this function with following [environment variables](https://firebase.google.com/docs/functions/config-env):

* `BACKUP_BUCKET`: Name of the bucket to back up "apod" images. Defaults to default Cloud Storage bucket.

### 2. `enqueuebackuptasks`
A HTTPS function responsible for enqueuing tasks to our task queue. The function uses the Firebase Admin SDK to create and enqueue a task for each day we want to backup an "apod" image.

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
You may see `PERMISSION DENIED` errors when enqueueing tasks or when Cloud Task tries to invoke your task queue functions. Ensure that your project has following IAM bindings:

* Identity used to enqueue tasks to Cloud Tasks needs `cloudtasks.tasks.create` IAM permission
  * In our sample, this is the [Compute Engine default service account](https://cloud.google.com/compute/docs/access/service-accounts).

```
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/cloudtasks.enqueuer
```

* Identity used to enqueue tasks to Cloud Task needs permission to use the service account associated with a task in Cloud Tasks.
  * In our sample, this is the [Compute Engine default service account](https://cloud.google.com/compute/docs/access/service-accounts).

```
Please follow Google Cloud IAM documentation to add App Engine default service account as user of App Engine default service account.
```

* Identity used to trigger the Task Queue function needs `cloudfunctions.functions.invoke` permission.
  * In our sample, this is the [Compute Engine default service account](https://cloud.google.com/compute/docs/access/service-accounts).

```
gcloud functions add-iam-policy-binding backupapod \
  --region=us-central1 \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/cloudfunctions.invoker
```