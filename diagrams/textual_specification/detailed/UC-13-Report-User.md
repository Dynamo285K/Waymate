Use Case Name: Report User

ID: UC-13

Actor: Registered User (Reporter), Admin (Receiver)

Preconditions:

    The Reporter is logged in.

    The Reporter has interacted with the Subject (via Chat or a shared Ride).

Main Success Scenario:

    The Reporter navigates to the profile of the user they wish to report or selects the "Report" option within a Chat or Past Ride.

    The Reporter selects a Reason for Report from a predefined list (e.g., Harassment, Dangerous Driving, No-show, Fake Profile).

    The Reporter provides a Detailed Description of the incident.

    The Reporter optionally uploads evidence (e.g., screenshots of external communication or photos).

    The Reporter clicks "Submit Report".

    The System logs the report and links it to the Subject's account.

    The System notifies the Admin of a new pending report for review.

    The System provides the Reporter with a confirmation that the report has been received and will be investigated.

Extensions (Alternative Flows):

    1a. Block User (Immediate Action): The system offers the Reporter an option to "Block" the Subject immediately. This hides all of the Reporter's future rides from the Subject and prevents any further messages in UC-12.

    7a. High-Frequency Reports: If the Subject receives multiple reports in a short timeframe, the system automatically flags the account for "Urgent Review" and may temporarily restrict their ability to Offer a Ride (UC-05).

Post-conditions:

    A formal report entry exists in the Administration dashboard.

    The Admin can now proceed to UC-15: Ban User or dismiss the report.