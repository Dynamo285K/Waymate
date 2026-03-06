Use Case Name: Manage Profile

ID: UC-18

Actor: Registered User

Preconditions:

    User is logged in.

Main Success Scenario:

    User navigates to the "My Account" section.

    The System displays the current profile state, including:

        Personal Information (Name, Avatar, Bio, Contact).

        Trust & Verification Status (Phone verified, ID status).

        Carpooling Preferences (Music, Smoking, Pets).

        Ride History summary.

    User selects an area to modify:

        Edit Basic Info: User updates name, email, or uploads a new profile picture.

        Manage Preferences: User toggles "Quiet Ride," "No Smoking," or "Pet Friendly" tags.

        Identity Verification: User uploads a photo of their ID for Admin approval (UC-19 logic).

        Security Settings: User changes their password or enables Two-Factor Authentication.

    User saves the changes.

    System validates data integrity (e.g., unique email, valid phone format).

    System updates the user's public profile, which will now be visible to others in UC-03 and UC-04.

Extensions (Alternative Flows):

    3a. View Ride History: User clicks on "History" to see a log of all past trips, ratings given, and ratings received.

    3b. Delete Account: User requests account deletion. The system checks for active/pending rides. If none exist, the account is deactivated (soft delete).

    5a. Verification Rejected: If the Admin rejects an ID upload, the user receives a notification with the reason and can re-upload a clearer image.

Post-conditions:

    User's updated information is reflected across the entire platform.

    Increased trust score if verification was completed.
