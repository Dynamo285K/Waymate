
Use Case Name: Manage Ride

ID: UC-08

Actor: Driver

Preconditions:

    Driver is logged in.

    Driver has at least one active ride (published but not yet completed).

Main Success Scenario:

    Driver navigates to "My Rides" and selects an active ride.

    Driver chooses the "Edit" option.

    Driver modifies specific details:

        Departure time (e.g., pushing it back by 15 minutes).

        Pickup/Drop-off specifics.

        Available seats (increasing or decreasing).

        Trip notes/preferences.

    Driver clicks "Save Changes".

    System validates the new data (ensuring time is still in the future).

    System updates the ride in the database.

    System checks for existing bookings: If passengers are already confirmed, the system sends them an automated notification about the changes.

Extensions (Alternative Flows):

    3a. Decreasing Seats Below Current Bookings: If the Driver tries to reduce seats to a number lower than the people already confirmed, the system blocks the action and asks the Driver to first cancel specific bookings.

    5a. Significant Change: If the date or departure city is changed, the system prompts the Driver to cancel the ride and create a new one instead to avoid passenger confusion.

Post-conditions:

    The updated ride details are reflected in search results (UC-03).

    Confirmed passengers are informed of any modifications.