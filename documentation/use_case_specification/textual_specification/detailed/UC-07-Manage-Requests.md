Use Case Name: Manage Requests

ID: UC-07

Actor: Driver

Preconditions:

    Driver has an active ride published (UC-05).

    At least one Passenger has requested a booking (UC-04).

Main Success Scenario:

    Driver receives a notification (Push/Email) about a new booking request.

    Driver opens the "Requests" tab within the specific ride details.

    Driver reviews the Passenger's profile:

        Name and profile picture.

        Average rating and past reviews.

    Driver chooses to Accept or Reject the request.

    If Accepted:

        System decrements the available seat count for that ride.

        System notifies the Passenger of the approval.

        System unlocks the Chat feature between this specific Passenger and the Driver.

    If Rejected:

        System notifies the Passenger of the rejection.

        The seat remains available for other users.

Extensions (Alternative Flows):

    4a. Auto-Expiration: If the Driver does not respond within a set timeframe (e.g., 24 hours or until 1 hour before departure), the system automatically cancels the request to free the Passenger to look for other rides.

    5a. Last Seat Logic: If accepting the request fills the car, the system automatically switches the ride status to "Full" and hides it from search results (UC-03).

Post-conditions:

    The booking status is updated to "Confirmed" or "Rejected".

    Seat capacity is updated in real-time.
