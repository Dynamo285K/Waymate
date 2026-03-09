Use Case Name: Manage Rides (Admin)

ID: UC-17

Actor: Admin

Preconditions:

    Admin is logged into the management console.

Main Success Scenario:

    Admin navigates to the "Global Ride Management" section.

    System displays all rides (Upcoming, Completed, and Cancelled).

    Admin selects a specific ride to view all details, including the list of confirmed passengers and chat logs (if policy allows).

    Admin performs an action:

        Modify Trip: Adjusts time or route if requested by a user who cannot access the app.

        Force Cancel: Cancels a ride that violates terms (e.g., illegal transport) without the Driver's consent.

    If Force Cancel is used, the system triggers the same logic as UC-09.1: Cancel All Bookings to protect passengers.

    System logs the intervention in the ride's history.

Extensions:

    4a. Dispute Resolution: Admin reviews ride details to settle a dispute between a Driver and Passenger regarding a "No-show."
