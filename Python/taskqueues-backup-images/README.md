# Back up images using a Task Queue Function (Python)

This sample shows how to set up a task queue function with the Firebase SDK for Cloud Functions in Python. It's the Python version of the [Node.js sample](../../Node/taskqueues-backup-images).

## Introduction

Task queue functions let you manage the execution, dispatch, and delivery of a large number of distributed tasks.

The sample uses them to back up every image from NASA's [Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html).

Task queue functions are powered by [Google Cloud Tasks](https://cloud.google.com/tasks). Learn more about [task queue functions](https://firebase.google.com/docs/functions/task-functions?gen=2nd).

## Functions

See [functions/main.py](functions/main.py) for the code. It defines two functions:

### 1. `backupapod`

A task queue function that backs up the Astronomy Picture of the Day ("apod") for a given date. Cloud Tasks calls this function once for every task enqueued on its queue.

Task queue functions let you control the rate limits and retry behavior of the queue. The sample uses these settings:

1. `RetryConfig(max_attempts=5)`: Each task is retried up to 5 times. This helps with transient errors such as network errors or a temporary outage of the NASA API.
2. `RetryConfig(min_backoff_seconds=60)`: Retries are spaced at least 60 seconds apart, so the 5 attempts aren't used up in a burst.
3. `RateLimits(max_concurrent_dispatches=10)`: At most 10 tasks run at a time. This keeps a steady stream of requests to the function and limits the number of active instances and cold starts.

You can configure this function with the following [parameter](https://firebase.google.com/docs/functions/config-env?gen=2nd#params):

* `BACKUP_BUCKET`: Name of the bucket that stores the "apod" images.

### 2. `enqueuebackuptasks`

An HTTP function that enqueues tasks on the queue. It uses the Firebase Admin SDK to create one task for each day to back up.

Because of the way Cloud Tasks authenticates requests to the task queue function, each task needs the function's Cloud Run URL. The `get_function_url` helper looks that URL up with the Cloud Functions API.

You can configure this function with the following parameters:

* `BACKUP_COUNT`: Number of days to back up, starting from 1995-06-17 (the first day of publication). Defaults to 100.
* `HOURLY_BATCH_SIZE`: Number of tasks to enqueue each hour. The NASA API allows 1000 requests per hour. Defaults to 600.

## Set up and deploy

### NASA Open API key

The sample fetches images with the [NASA Open APIs](https://api.nasa.gov/). Register for an API key, then provide it as the `NASA_API_KEY` parameter when the CLI prompts you during deployment, or add it to `functions/.env`:

```
NASA_API_KEY=your-api-key
```

### Deploy

```bash
firebase deploy
```

## IAM policy

Unlike the Node.js sample, the Python sample can't declare its IAM requirements in code, so you grant the roles yourself. The sample runs as the [Compute Engine default service account](https://cloud.google.com/compute/docs/access/service-accounts), which needs these bindings:

* To enqueue tasks, `roles/cloudtasks.enqueuer` on the project:

```
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/cloudtasks.enqueuer
```

* To act as the service account that Cloud Tasks uses to call the function, `roles/iam.serviceAccountUser` on that account. In this sample both accounts are the same, so the account needs the role on itself:

```
gcloud iam service-accounts add-iam-policy-binding ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

* To invoke the task queue function, `roles/run.invoker` on the function:

```
gcloud functions add-iam-policy-binding backupapod \
  --region=us-east4 \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/run.invoker
```

If tasks fail with `401` or `403` (`PERMISSION_DENIED`) in the Cloud Tasks logs, check that the `roles/run.invoker` binding exists and that `get_function_url` returns the function's Cloud Run URL for the region you deployed to. Cloud Tasks mints an OIDC token for that URL, and Cloud Run rejects the token if the URL doesn't match.

## Test

Open the URL of the `enqueuebackuptasks` function in a browser or with `curl`. The response reports how many tasks were enqueued. As Cloud Tasks dispatches them, images appear under `apod/` in your backup bucket and each run shows up in the `backupapod` function logs.
