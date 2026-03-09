Use Case Name: Offer a Ride

ID: UC-05

Actor: Driver

Preconditions:

    User is logged in.

    User has a vehicle registered in their profile (linked to UC-06: Add Car).

Main Success Scenario:

    Driver selects the "Offer a Ride" action from the main dashboard.

    Driver enters the Ride Parameters:

        Departure location and Destination.

        Date and Time of departure.

        Intermediate stops (optional).

    Driver selects which of their registered Vehicles will be used.

    [Include: UC-05.1: Add Pricing]: Driver specifies the price per seat.

    Driver sets the Capacity (number of available passenger seats).

    Driver adds optional ride Preferences (e.g., luggage size, pets, smoking policy).

    Driver clicks "Publish".

    System validates that the date is in the future and that the driver has no conflicting rides at that time.

    System makes the ride visible in the search results (UC-03).

Extensions (Alternative Flows):

    3a. No Vehicle Found:

            System detects the driver has not added a car yet.

            System redirects the user to UC-06: Add Car.

            After adding the car, the user is returned to the "Offer a Ride" flow.

    8a. Incomplete Data: System highlights missing required fields (e.g., missing price or destination) and prevents publishing.

Included Use Cases:

    UC-05.1: Add Pricing: A mandatory sub-step where the system may suggest a price range based on the distance/fuel costs.

Post-conditions:

    The ride is active in the system.

    The Driver can now receive incoming booking requests (UC-04).
