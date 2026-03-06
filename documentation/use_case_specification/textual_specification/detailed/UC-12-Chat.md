Use Case Name: Chat & Message Requests

ID: UC-12

Actor: Registered User (Driver or Passenger)

Preconditions:

    Both users are logged in.

    The sender has found the recipient through a specific ride listing.

Main Success Scenario (Linked Users):

    A Passenger with a Confirmed or Pending booking opens the chat.

    The user sends a message.

    The System delivers it directly to the recipient's primary inbox.

    A notification is triggered immediately.

Alternative Path (Message Request - Not Linked):

    A User finds a ride but has not yet booked it.

    The User selects "Ask a Question" or "Message Driver."

    The User sends a message.

    The System identifies that no booking link exists.

    The System places the message into a "Message Requests" folder for the Driver.

    The Driver receives a low-priority notification.

    The Driver can choose to:

        Accept: The chat moves to the primary inbox, and they can converse freely.

        Ignore/Delete: The sender is not notified of the ignore, and the message is hidden.

        Block: (Triggers UC-13: Report/Block User).

Extensions (Alternative Flows):

    4a. Spam Protection: The system limits a user to 1-2 unaccepted message requests per ride to prevent harassment.

    7a. Post-Trip Expiry: 48 hours after a trip is completed, the chat becomes "Read-Only" to maintain a record while closing the communication channel.

Post-conditions:

    Communication is facilitated while maintaining user privacy and control over their inbox.