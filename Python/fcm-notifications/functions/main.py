import firebase_admin
from firebase_admin import auth, db, messaging, exceptions
from firebase_functions import db_fn

firebase_admin.initialize_app()
messaging.UnregisteredError


@db_fn.on_value_written(reference=r"followers/{followedUid}/{followerUid}")
def send_follower_notification(event: db_fn.Event[db_fn.Change]) -> None:
    """Triggers when a user gets a new follower and sends a notification.

    Followers add a flag to `/followers/{followedUid}/{followerUid}`.
    Users save their device notification tokens to
    `/users/{followedUid}/notificationTokens/{notificationToken}`.
    """
    follower_uid = event.params["followerUid"]
    followed_uid = event.params["followedUid"]

    # If un-follow we exit the function.
    change = event.data
    if not change.after:
        print(f"User {follower_uid} unfollowed user {followed_uid} :(")
        return

    print(f"User {follower_uid} is now following user {followed_uid}")
    tokens_ref = db.reference(f"users/{followed_uid}/notificationTokens")
    notification_tokens = tokens_ref.get()
    if (not isinstance(notification_tokens, dict) or len(notification_tokens) < 1):
        print("There are no tokens to send notifications to.")
        return
    print(f"There are {len(notification_tokens)} tokens to send notifications to.")

    follower: auth.UserRecord = auth.get_user(follower_uid)
    notification = messaging.Notification(
        title="You have a new follower!",
        body=f"{follower.display_name} is now following you.",
        image=follower.photo_url if follower.photo_url else "",
    )

    # Send notifications to all tokens.
    msgs = [
        messaging.Message(token=token, notification=notification) for token in notification_tokens
    ]
    batch_response: messaging.BatchResponse = messaging.send_each(msgs)
    if batch_response.failure_count < 1:
        # Messages sent sucessfully. We're done!
        return

    # Clean up the tokens that are not registered any more.
    for i in range(len(batch_response.responses)):
        exception = batch_response.responses[i].exception
        if not isinstance(exception, exceptions.FirebaseError):
            continue
        message = exception.http_response.json()["error"]["message"]
        if (isinstance(exception, messaging.UnregisteredError) or
                message == "The registration token is not a valid FCM registration token"):
            tokens_ref.child(msgs[i].token).delete()
