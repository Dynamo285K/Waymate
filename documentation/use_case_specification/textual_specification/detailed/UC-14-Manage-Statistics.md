Use Case Name: Manage Statistics

ID: UC-14

Actor: Admin

Preconditions:

    User is logged in with Admin privileges.

Main Success Scenario:

    Admin selects the "Analytics Dashboard" from the sidebar.

    System fetches and displays real-time data visualizations:

        User Metrics: Total registered users, ratio of Drivers to Passengers, and active users in the last 24 hours.

        Ride Metrics: Number of active rides, completed rides, and cancellation rates.

        Route Popularity: A heatmap or list of the most frequent departure/destination pairs (e.g., Prague – Brno).

    Admin selects a Time Range (e.g., Last 7 days, Monthly, Yearly).

    System updates the charts and tables based on the selected period.

    Admin clicks "Export Report".

    System generates a downloadable file (PDF or CSV) containing the filtered data.

Extensions (Alternative Flows):

    2a. System Latency: If the database contains millions of records, the system displays a loading state and uses cached data from the last hour to ensure performance.

    3a. Custom Comparison: Admin selects two different time periods to compare growth (e.g., This December vs. Last December).

    4a. No Data Found: If the selected filters return no results, the system displays "No data available for this period" instead of empty charts.

Post-conditions:

    Admin has a clear overview of platform performance.

    Business decisions (e.g., marketing in specific cities) can be made based on the data.
