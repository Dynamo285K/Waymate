Use Case Name: Add Car

ID: UC-06

Actor: Driver

Preconditions:

    User is logged in as a Registered User.

Main Success Scenario:

    User navigates to their Profile or Vehicle Management section.

    User selects "Add New Vehicle".

    User enters the vehicle details:

        Brand (e.g., Skoda).

        Model (e.g., Octavia).

        Color.

    [Include: UC-06.1: Add SPZ]: User enters the State Registration Number (SPZ/License Plate).

    User optionally uploads a photo of the vehicle.

    System validates the SPZ format and ensures all required fields are filled.

    System saves the vehicle to the user’s account.

    System automatically grants the user the Driver role (if not already assigned).

Extensions (Alternative Flows):

    4a. Invalid SPZ Format: System detects a non-standard license plate format and prompts the user to correct it.

    5a. Image Too Large: System requests the user to upload a smaller file or performs automatic compression.

    7a. Duplicate Vehicle: If the SPZ is already registered by another user, the system flags this for manual review by an Admin.

Included Use Cases:

    UC-06.1: Add SPZ: The specific task of entering and validating the unique identifier for the vehicle.

Post-conditions:

    The vehicle is available for selection when using UC-05: Offer a Ride.

    The User is now identified by the system as a potential Driver.
