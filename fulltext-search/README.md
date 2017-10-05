# Full-text search via Algolia

This template shows how to enable full text search on firebase database elements by using an Algolia hosted search service.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Database Structure

As an example we'll be using a simple blog structure:

```
/functions-project-12345
    /blog-posts
        /key-123456
            text: "This is my first blog entry..."
            last_index_timestamp: 1234567890
        /key-123457
            text: "This is my second blog entry..."
            last_index_timestamp: 1234567891
    /search
        /queries
            /key-546789
                query: "first entry"
            /key-078234
                query: "second entry"
        /results
            /key-546789
                hits: [...
            /key-078234
                hits: [...
        /last_query_timestamp: 1234567892
```

Whenever a new blog post is created or modified a Function sends the content to be indexed to the Algolia instance.
To perform new searches clients add the search query to the realtime database under `/search/queries/` which triggers a
Firebase function which performs the search on the Algolia instance. The results are written under the `/search/results/`
tree.


## Setting up the sample

Create an Algolia account at [www.algolia.com](https://www.algolia.com/).

Enable Billing on your Firebase project by switching to the Blaze or Flame plans you need billing enabled to allow external requests. For more information have a look at the [pricing page](https://firebase.google.com/pricing/).

Set the `algolia.app_id` and `algolia.api_key` Google Cloud environment variables to match the Algolia application ID and API key of your account. For this use:

```bash
firebase functions:config:set algolia.app_id="myAlgoliaAppId" algolia.api_key="myAlgoliaApiKey"
```
