
Use Case Name: Ban User

ID: UC-15

Actor: Admin

Preconditions:

    Admin is logged into the administrative interface.

    There is a user account that has violated terms of service (often identified via UC-13).

Main Success Scenario:

    Admin searches for a specific user in the user management list or opens the user profile directly from a received report.

    Admin selects the "Ban User" option.

    Admin selects the Ban Type:

        Temporary: Sets an expiration date (e.g., 7 days for inappropriate messaging).

        Permanent: Total removal from the platform (e.g., for fraud or dangerous behavior).

    Admin enters the Reason for Banning (includes an internal note and a text description visible to the user).

    Admin confirms the action.

    System performs automated cleanup:

        Immediately terminates all active sessions (logs the user out of all devices).

        Cancels all rides offered by the user (UC-09) and all their active bookings (UC-10).

        Informs affected passengers/drivers about the cancellation due to "administrative action."

    System sends an email notification to the user regarding the ban and the reason.

Extensions (Alternative Flows):

    3a. Unban User: Admin can navigate to the "Banned Users" list and select "Lift Ban," restoring the user's access immediately.

    6a. Blacklisting: For permanent bans, the system adds the user's email hash or phone number to a blacklist to prevent immediate re-registration with the same credentials.

Post-conditions:

    The user cannot log in (UC-01).

    The user's profile is hidden from public search.