# Webhook upon Database writes

This Function shows how a Database write can trigger a request to a hardcoded callback URL (a Webhook). The content of the modified Data is sent to the Webhook.

## Functions Code

See file [index.js](functions/index.js) for the code.

This is done by sending a request to a given URL. As a sample we're using a Request Bin from [requestb.in](http://requestb.in) that will receive the Data so you can visualize it easily. make sure you create your own Request Bin and update the sample with it.

## Sample Database Structure

As an example we'll be using a database structure where adding or updating an element under `/hooks` will trigger the Webhook:

```
/functions-project-12345
    /hooks
        /key-123456
            stuff: "Whatever"
            more_stuff: "Cool"
        /key-123457
            things: "A car"
            more_things: "A truck"
```
