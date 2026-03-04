Use Case Name: Book a Ride

ID: UC-04

Actor: Passenger

Preconditions: * User is logged in as a Registered User (Passenger).

    User has selected a specific ride from UC-03: Show Available Rides.

    The ride has at least one vacant seat.

Main Success Scenario:

    Passenger reviews the ride details (price, car, driver rating, and preferences).

    Passenger selects the number of seats required.

    Passenger clicks the "Request Booking" button.

    System verifies seat availability in real-time.

    System sends a push notification/email to the Driver regarding the new request.

    System sets the booking status to "Pending Approval".

    System displays a confirmation message to the Passenger that the request was sent.

Extensions (Alternative Flows):

    4a. Last Seat Taken: If another user booked the last seat while the Passenger was reviewing, the system notifies the Passenger and prevents the request.

    5a. Instant Booking (Optional Feature): If the Driver has "Instant Book" enabled, the system skips the approval step, confirms the booking immediately, and decrements the seat count.

    6a. Passenger Cancels Request: Passenger changes their mind before the Driver responds; they click "Cancel Request" (UC-11: Cancel Booking logic).

Post-conditions:

    A "Booking Request" record is created in the database.

    The Driver is notified and must now perform UC-07: Manage Requests (Accept/Reject).

    A temporary chat channel may be opened for pre-ride questions.