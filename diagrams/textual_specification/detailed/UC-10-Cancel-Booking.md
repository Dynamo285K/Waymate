Use Case Name: Cancel Booking

ID: UC-10

Actor: Passenger

Preconditions:

    Passenger is logged in.

    Passenger has a "Confirmed" or "Pending" booking for a future ride.

Main Success Scenario:

    Passenger navigates to "My Bookings".

    Passenger selects the specific ride they wish to withdraw from.

    Passenger clicks the "Cancel Booking" button.

    System asks for confirmation of the cancellation.

    Passenger confirms.

    System updates the booking status to "Cancelled by Passenger".

    System sends a notification to the Driver informing them that a seat has become available.

    System increments the available seat count for that ride by the number of seats canceled.

    The ride automatically reappears in search results (UC-03) if it was previously "Full".

Extensions (Alternative Flows):

    4a. Cancellation Policy Violation: If the Passenger cancels very close to departure (e.g., less than 1 hour), the system may display a warning that this might result in a negative "reliability" flag on their profile.

    7a. Pending Request: If the booking was still "Pending" (not yet accepted by the Driver), the system simply removes the request and the Driver is notified that the request is no longer active.

Post-conditions:

    The Passenger is no longer part of the ride.

    The Driver is notified of the vacancy.

    Seat capacity is restored.
