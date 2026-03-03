graph LR
    %% ===== ACTORS =====
    unUser((Unregistered User))
    regUser((Registered User))
    driver((Driver))
    passenger((Passenger))
    admin((Admin))

    %% Actor hierarchy
    unUser --> regUser
    regUser --> driver
    regUser --> passenger

    subgraph "Splujazda sketch"
        subgraph "Authentication"
            register[Register]
            login[Login]
        end

        subgraph "Ride Management"
            show[Show available rides]
            book[Book a ride]
            offer[Offer a ride]
            manageRide[Manage ride]
            manageRequests[Manage requests]
            addC[Add car]
            addSPZ[Add SPZ]
            pricing[Add pricing]
            cancelRide[Cancel ride]
            cancelBooking[Cancel booking]
            cancelAllBookings[Cancel all bookings]
        end

        subgraph "Rating"
            rateD[Rate driver]
            rateP[Rate passenger]
        end

        subgraph "Profile & Communication"
            profile[Manage profile]
            chat[Chat]
            report[Report user]
        end

        subgraph "Administration"
            stats[Manage statistics]
            ban[Ban user]
        end
    end

    %% ===== RELATIONS =====
    unUser --> register
    unUser --> login

    regUser --> show
    regUser --> profile
    regUser --> chat
    regUser --> report

    driver --> offer
    driver --> manageRide
    driver --> manageRequests
    driver --> addC
    driver --> rateP
    driver --> cancelRide

    passenger --> book
    passenger --> rateD
    passenger --> cancelBooking

    admin --> ban
    admin --> stats

    %% Include relations
    cancelRide -.->|include| cancelAllBookings
    addC -.->|include| addSPZ
    offer -.->|include| pricing
