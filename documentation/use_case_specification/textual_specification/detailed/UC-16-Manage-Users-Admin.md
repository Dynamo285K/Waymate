
Use Case Name: Manage Users (Admin)

ID: UC-16

Actor: Admin

Preconditions:

    Admin is logged into the management console.

Main Success Scenario:

    Admin navigates to the "User Management" section.

    System displays a searchable and filterable list of all registered users.

    Admin selects a specific user profile to view details (Email, Phone, Car details, Rating history).

    Admin performs an action:

        Edit Profile: Modifies user data (e.g., correcting a name or resetting a profile picture).

        Verify User: Manually marks a user as "Verified" (e.g., checking ID documents if required).

        Reset Password: Triggers a password reset link for the user.

    System saves the changes and logs the Admin's action for auditing purposes.

Extensions:

    3a. User Search: Admin filters users by status (Active, Banned, Pending) or searches by email/SPZ.