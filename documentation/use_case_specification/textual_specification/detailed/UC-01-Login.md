Use Case Name: Login

ID: UC-01

Actor: Unregistered User (Primary), Google Auth Service (Secondary)

Preconditions: \* The user has an active internet connection.

    The user is currently on the "Login" page of the application.

Main Success Scenario (Standard Login):

    User enters their registered email address and password.

    User clicks the "Login" button.

    System validates the input format (e.g., non-empty fields, valid email string).

    System verifies credentials against the encrypted database records.

    System generates a session token for the user.

    System redirects the user to the Dashboard/Home Screen as a Registered User.

Alternative Path (Login via Google):

    User clicks the "Login with Google" button.

    System redirects the user to the Google Authorization Server.

    User provides their Google credentials and grants permission to the app.

    Google redirects back to the app with an authorization code/token.

    System validates the token with Google and retrieves the user's email and profile info.

    Branch 6a: If the email exists in our database, the system logs them in.

    Branch 6b: If the email does not exist, the system automatically creates a new profile (triggers UC-02: Register logic internally) and then logs them in.

Extensions (Exception Flows):

    3a. Invalid Input Format: System highlights the incorrect field and displays a message (e.g., "Please enter a valid email").

    4a. Incorrect Credentials: System displays a generic error message ("Invalid email or password") to prevent account harvesting.

    5a. Account Banned: System detects a "Banned" flag in the database; it prevents login and displays the reason/contact for appeal.

    G1. Google Auth Cancelled: User closes the Google pop-up; system returns to the login screen with no changes.

Post-conditions:

    User is authenticated and has access to "Registered User" features (Chat, Profile, etc.).

    A secure session is established.
