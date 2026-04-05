# Detailed Wireflow Documentation: Ride-Sharing Platform

## 1. Navigation & State Management (The "Tabs")

The platform employs a dual-state architecture on the homepage to clearly separate the two primary user roles: passengers and drivers.

**Find Your Ride (Passenger State):** This is the default landing state for the application. It prominently features a search bar where passengers can input their pickup location, drop-off location, and desired travel date.

**Share Your Ride (Driver State):** This secondary tab transforms the main hero section into a trip-offering form, allowing drivers to submit details about rides they are offering.

**Technical Note:** Switching between these tabs updates the corresponding functional components, such as forms or search results, without requiring a page reload. This design ensures a smooth Single Page Application (SPA) experience.

---

## 2. Comprehensive User Flows

### A. Search and Booking Flow (Passenger)

Passengers begin by entering their route and travel date in the search input. A date-picker component ensures accurate scheduling.

The system then displays **available rides** in a list view. Each card presents the driver’s name, profile photo, trip price, and departure and arrival times. A "Book" button is provided as a clear call to action, leading the user to detailed ride information.

Upon selecting a ride, passengers are presented with a **booking confirmation screen or modal**, where they can review trip details before final submission.

After the trip, a **rating system** allows passengers to leave a 1-5 star review for the driver, helping to build trust and accountability within the platform.

---

### B. Trip Creation & Management Flow (Driver)

Drivers can create new trips using the "Share Your Ride" form by entering essential trip details, including origin, destination, time, available seats, and price.

The **My Rides** dashboard allows drivers to efficiently manage their trips. This includes:

- **Active Rides:** A list of upcoming trips, along with the passengers who have booked them.
- **Past Rides:** A history of completed trips for reference and record-keeping.
- **Passenger Requests:** A management interface where drivers can approve or decline ride requests from passengers, giving them full control over trip participation.

---

### C. User Authentication & Profile

Authentication is handled through clean, centered modals for logging in or creating a new account.

**Log In:** Users can enter their email and password to access their account, with a convenient "Forgot Password" link for account recovery.

**Sign Up:** New users provide basic information, including name, email, and password, to create a platform account.

Once logged in, the **User Dashboard** provides sidebar navigation for a consistent experience. This includes:

- **Personal Info:** A form-based editor for updating profile details and vehicle information.
- **Messages (Chat):** A split-screen chat interface enabling real-time coordination between drivers and passengers.
- **Settings:** Options to customize notification preferences, account security, and other preferences via toggle switches and input fields.

---

This wireflow documentation fully captures the key navigation patterns, functional flows, and interaction points for both passengers and drivers, providing a clear blueprint for designers and developers.

Figma design:  
https://www.figma.com/design/KHN38DZydkIcnB1AEUoylX/Untitled?node-id=4-6455&t=xfou1EOKOHO5o9bS-1
