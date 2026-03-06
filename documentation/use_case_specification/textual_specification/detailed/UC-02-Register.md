
Use Case Name: Register

ID: UC-02

Actor: Unregistered User

Preconditions: * The user is on the "Registration" page.

    The user does not already have an active account with the provided email.

Main Success Scenario (Manual Registration):

    User enters required information: Full Name, Email, and Password.

    User confirms the password to ensure accuracy.

    User checks the "I agree to Terms and Conditions" box.

    User clicks the "Create Account" button.

    System validates data:

        Password meets complexity requirements (e.g., min 8 chars, 1+ number, 1+ special symbol).

        Email is in a valid format.

        Email is not already registered.

    System creates a new user record with a "Pending Verification" status.

    System sends a verification email to the user's address.

    System redirects the user to a "Verify your Email" landing page.

Alternative Path (Automatic Registration via Google):

    User selects "Login/Register with Google" (as seen in UC-01).

    System receives profile data from Google.

    System detects that no account exists for this Google email.

    System automatically creates a Registered User profile using the Google Name and Email.

    System sets the account status to "Active" immediately (skipping manual email verification since Google already verified the email).

    User is redirected to the Profile Management page to complete optional details (e.g., phone number).

Extensions (Exception Flows):

    5a. Email Already Exists: System informs the user that an account is already associated with this email and suggests the Login page.

    5b. Weak Password: System provides real-time feedback on password strength and prevents submission until requirements are met.

    7a. Email Delivery Failed: System provides an option to "Resend Verification Email" after a 60-second cooldown.

Post-conditions:

    A new user record is created in the database.

    The user is assigned the default role of Registered User.

    If manual: Account remains restricted until email verification.

    If Google: Account is fully active.