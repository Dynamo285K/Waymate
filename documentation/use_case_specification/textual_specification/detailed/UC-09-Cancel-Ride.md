
Use Case Name: Cancel Ride

ID: UC-09

Actor: Driver

Preconditions:

    Driver is logged in.

    Driver has an active ride (scheduled for the future).

Main Success Scenario:

    Driver navigates to "My Rides" and selects the ride they wish to cancel.

    Driver clicks the "Cancel Ride" button.

    System prompts for a reason for cancellation (e.g., car breakdown, personal reasons).

    Driver confirms the cancellation.

    [Include: UC-09.1: Cancel All Bookings]:

        System identifies all Passengers with "Confirmed" or "Pending" status for this ride.

        System triggers a high-priority notification (Push/SMS/Email) to all affected Passengers.

        System automatically releases any held funds or "credits" (if a payment module is implemented).

    System removes the ride from public search results (UC-03).

    System archives the ride with a "Cancelled" status for administrative records.

Extensions (Alternative Flows):

    4a. Last-Minute Cancellation: If the cancellation occurs very close to the departure time (e.g., less than 2 hours), the system may flag the Driver's profile or apply a temporary rating penalty to discourage unreliable behavior.

    5a. No Passengers: If no bookings exist, the system skips the notification step and completes the cancellation immediately.

Included Use Cases:

    UC-09.1: Cancel All Bookings: The automated process of mass-notifying passengers and clearing the booking list.

Post-conditions:

    The ride is no longer active.

    All associated passengers are notified and their "booked" status is cleared.