Use Case Name: Show Available Rides

ID: UC-03

Actor: Unregistered User, Registered User, Passenger

Preconditions: None (This is a public-facing search).

Main Success Scenario:

    User enters the Search Criteria:

        Departure City/Point.

        Destination City/Point.

        Date (optional, defaults to "today").

    User clicks the "Search" button.

    System filters the database for active rides that match the route and have at least one seat available.

    System displays a list of results showing:

        Driver's name and rating.

        Departure/Arrival times.

        Price.

        Remaining seats.

        Car model.

    User selects a specific ride to view more details (exact pickup point, driver bio, car photo).

Extensions (Alternative Flows):

    3a. No Exact Match Found: * 1. System informs the user no direct rides were found.

            System suggests rides from nearby cities or on different dates.

    4a. User is Unregistered:

            User clicks "Book".

            System redirects to UC-01: Login / UC-02: Register before allowing the booking to proceed.

    5a. Filtering/Sorting: User sorts results by "Cheapest", "Earliest Departure", or "Highest Rated Driver".

Post-conditions:

    User has identified a potential ride.

    If the user is a Passenger, they can proceed to UC-04: Book a Ride.
