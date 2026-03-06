Use Case Name: Rate User (Driver/Passenger)

ID: UC-11

Actor: Driver, Passenger

Preconditions:

    The trip has reached its scheduled arrival time or has been marked as "Completed" by the system.

    Both actors have participated in the ride together.

Main Success Scenario:

    Once the trip is over, the System sends a notification to both the Driver and the Passenger(s) prompting them to leave a review.

    User opens the notification or goes to the "Past Rides" section.

    User selects the person they wish to rate.

    User provides a Numeric Rating (e.g., 1 to 5 stars).

    User provides optional Text Feedback (comment).

    User clicks "Submit Review".

    System validates that a rating has been selected.

    System saves the review and updates the Average Rating displayed on the target user's profile.

Alternative Path (Rate Passenger):

    Actor: Driver

    Driver rates the passenger on punctuality, communication, and behavior.

Alternative Path (Rate Driver):

    Actor: Passenger

    Passenger rates the driver on safety, cleanliness of the vehicle, and punctuality.

Extensions (Exception Flows):

    1a. Trip Cancelled: If the trip was cancelled by either party (UC-09 or UC-10), the rating feature is disabled for that ride to prevent "revenge ratings."

    6a. Exceeded Rating Window: The user attempts to leave a review after the rating period (e.g., 14 days after the trip). The system informs them the window has closed.

    8a. Private Feedback: The user can opt to leave a private note that only the Admin can see (for safety concerns).

Post-conditions:

    The target user's profile rating is recalculated.

    Trust levels within the community are updated.
