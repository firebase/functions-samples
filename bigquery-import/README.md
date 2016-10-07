# Import Data to Big Query

This template shows how to copy data from the Realtime Database (such as logs being written there) to Google Cloud's BigQuery.

## Function Code

See file [index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](package.json).

## Sample Database Structure

As an example we'll be using a simple logs database structure:

```
/functions-project-12345
    /logs
        /key-123456
            text: "User signed in."
        /key-123457
            text: "Error: Could not connect to Database"
```

## Setting up the sample

Set the `bigquery.datasetName` and `bigquery.tableName` Google Cloud environment variables to match the Dataset name and the Table name where you want the logs written to. For this use:

```bash
firebase env:set bigquery.datasetName="bar" bigquery.tableName="baz"
```
