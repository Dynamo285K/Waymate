
Data Entity Specification

---

## 1. User Entity (`users`)
*Primary registry for participants. Optimized for identity, profile display, moderation-aware lifecycle handling, and future profile extensibility.*

**Constraints:**
* **`UNIQUE INDEX ON lower(email)`**: Primary login credential must be unique case-insensitively.
* **`CHECK (rating_count >= 0)`**
* **`CHECK (avg_rating BETWEEN 0 AND 5)`**
* **`CHECK (completed_rides_count >= 0)`**
* **`CHECK (no_show_count >= 0)`**
* Aggregate counters and rating fields are stored as denormalized current-state values and must be synchronized transactionally with their source events.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `email` | String | | No | `Yes — unique login and lookup` | Primary login credential. |
| `password_hash` | String | | No | `No` | Argon2/BCrypt secure hash. |
| `first_name` | String | | No | `No` | First name. |
| `last_name` | String | | No | `No` | Last name. |
| `display_name` | String | | No | `Optional — profile search/display` | Public profile name shown in UI. |
| `phone` | String | | Yes | `Optional — verification and duplicate detection` | Contact number in E.164 format. Nullable if not provided or not used for verification. |
| `profile_photo_url` | String | | Yes | `No` | Public profile image reference. |
| `bio` | Text | | Yes | `No` | Optional public profile text. |
| `avg_rating` | Decimal(3,2) | | No | `No` | Pre-calculated average rating. |
| `rating_count` | Integer | | No | `No` | Total number of reviews received. |
| `completed_rides_count` | Integer | | No | `No` | Total completed rides as driver or passenger. |
| `no_show_count` | Integer | | No | `No` | Counter for operational trust scoring. |
| `email_verified_at` | Timestamp | | Yes | `Optional — admin filtering` | Email verification time. |
| `phone_verified_at` | Timestamp | | Yes | `Optional — admin filtering` | Phone verification time. Present only if phone verification was completed. |
| `last_active_at` | Timestamp | | Yes | `No` | Last seen activity time. |
| `user_status_id` | Integer | **FK** | No | `Yes — joins and admin filtering` | Refers to `user_statuses.id`. |
| `created_at` | Timestamp | | No | `Yes — chronology and admin listing` | Audit: Registration time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last profile update time. |
| `deleted_at` | Timestamp | | Yes | `Optional — soft delete filtering` | Soft delete for compliance. |

---

## 2. Vehicle Entity (`cars`)
*Vehicle details with operational display fields, activation state, and international registration support.*

**Constraints:**
* **`UNIQUE (spz, country_code)`**
* **`CHECK (seats_total > 0)`**

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `owner_id` | UUID | **FK** | No | `Yes — owner lookup and joins` | Refers to `users.id`. |
| `model_id` | Integer | **FK** | No | `Optional — joins` | Refers to `car_models.id`. |
| `spz` | String | | No | `Yes — uniqueness with country` | License plate string. |
| `country_code` | String(3) | | No | `Yes — uniqueness with plate` | ISO 3166-1 alpha-3 code. |
| `color` | String | | Yes | `No` | Vehicle color for rider recognition. |
| `seats_total` | Integer | | No | `No` | Maximum passenger capacity. |
| `is_active` | Boolean | | No | `Optional — active vehicle filtering` | Whether the car can be assigned to rides. |
| `created_at` | Timestamp | | No | `Optional — chronology` | Audit: Vehicle creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last vehicle update time. |
| `deleted_at` | Timestamp | | Yes | `Optional — soft delete filtering` | Soft delete. |

---

## 3. Ride Entity (`rides`)
*The core itinerary record enriched with product, search, and operational attributes.*

**Constraints:**
* **`CHECK (available_seats_cached >= 0)`**
* `driver_id` should be validated against `cars.owner_id` in application logic or trigger.
* Origin and destination search fields must remain synchronized with boundary stops.
* `origin_stop_id` and `destination_stop_id` may be nullable during draft creation, but must be non-null before a ride becomes publicly searchable or bookable.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique trip ID. |
| `driver_id` | UUID | **FK** | No | `Yes — joins and driver ride listing` | Refers to `users.id`. |
| `car_id` | UUID | **FK** | No | `Optional — joins` | Refers to `cars.id`. |
| `departure_at` | Timestamp | | No | `Yes — time filtering and ordering` | Scheduled departure time from origin. |
| `arrival_estimate_at` | Timestamp | | Yes | `Optional — schedule display` | Estimated arrival time at destination. |
| `ride_status_id` | Integer | **FK** | No | `Yes — status filtering` | Refers to `ride_statuses.id`. |
| `origin_stop_id` | UUID | **FK** | Yes | `No` | Search optimization pointer to first stop. |
| `destination_stop_id` | UUID | **FK** | Yes | `No` | Search optimization pointer to last stop. |
| `origin_city` | String | | No | `Yes — route search` | Denormalized search field. |
| `destination_city` | String | | No | `Yes — route search` | Denormalized search field. |
| `origin_country_code` | String(3) | | Yes | `Optional — geographic filtering` | Denormalized search field. |
| `destination_country_code` | String(3) | | Yes | `Optional — geographic filtering` | Denormalized search field. |
| `origin_lat` | Decimal(9,6) | | Yes | `Optional — location search` | Search optimization coordinate. |
| `origin_lng` | Decimal(9,6) | | Yes | `Optional — location search` | Search optimization coordinate. |
| `destination_lat` | Decimal(9,6) | | Yes | `Optional — location search` | Search optimization coordinate. |
| `destination_lng` | Decimal(9,6) | | Yes | `Optional — location search` | Search optimization coordinate. |
| `available_seats_cached` | Integer | | No | `Yes — availability filtering` | Cached minimum available seats across all currently bookable ride segments. |
| `currency` | String(3) | | No | `No` | Default ride display currency. |
| `description` | Text | | Yes | `Optional — text search` | Driver notes and trip context. |
| `instant_booking_enabled` | Boolean | | No | `Optional — booking mode filtering` | Whether bookings can auto-confirm. |
| `luggage_allowed` | Boolean | | No | `Optional — ride filtering` | Whether luggage is allowed. |
| `pets_allowed` | Boolean | | No | `Optional — ride filtering` | Whether pets are allowed. |
| `smoking_allowed` | Boolean | | No | `Optional — ride filtering` | Whether smoking is allowed. |
| `women_only` | Boolean | | No | `Optional — safety/product filtering` | Optional trust/safety product rule. |
| `max_two_backseat` | Boolean | | No | `Optional — comfort filtering` | Comfort preference toggle. |
| `created_at` | Timestamp | | No | `Yes — chronology and admin listing` | Audit: Ride creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last ride update time. |
| `deleted_at` | Timestamp | | Yes | `Optional — soft delete filtering` | Soft delete. |

---

## 4. Ride Stop Entity (`ride_stops`)
*Defines origin, intermediate, and destination points along the route.*

**Constraints:**
* **`UNIQUE (ride_id, stop_order)`**
* **`UNIQUE (id, ride_id)`**
* **`CHECK (stop_order >= 0)`**
* **`CHECK (lat BETWEEN -90 AND 90)`**
* **`CHECK (lng BETWEEN -180 AND 180)`**

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `ride_id` | UUID | **FK** | No | `Yes — joins and ordered stop loading` | Refers to `rides.id`. |
| `address` | String | | No | `No` | Human-readable full location. |
| `city` | String | | No | `Optional — stop search and reporting` | Search-friendly city field. |
| `country_code` | String(3) | | Yes | `Optional — geographic filtering` | ISO 3166-1 alpha-3 code. |
| `lat` | Decimal(9,6) | | No | `Optional — location search` | Latitude. |
| `lng` | Decimal(9,6) | | No | `Optional — location search` | Longitude. |
| `stop_order` | Integer | | No | `Yes — route ordering and uniqueness` | Sequence index (`0 = Start`). |
| `planned_arrival_at` | Timestamp | | Yes | `Optional — route scheduling` | Planned arrival time at this stop. |
| `planned_departure_at` | Timestamp | | Yes | `Optional — route scheduling` | Planned departure time from this stop. |
| `created_at` | Timestamp | | No | `No` | Audit: Stop creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last stop update time. |

---

## 5. Pricing Entity (`prices`)
*Defines optional published prices for selected ride segments. The pricing model is intentionally scope-limited for MVP and does not require a fully populated matrix of all stop combinations.*

**Constraints:**
* **`UNIQUE (ride_id, start_stop_id, end_stop_id)`**
* **`CHECK (amount >= 0)`**
* **`CHECK (start_stop_id <> end_stop_id)`**
* **`CHECK (start_stop_order < end_stop_order)`**
* Composite FK `(start_stop_id, ride_id)` → `ride_stops(id, ride_id)`
* Composite FK `(end_stop_id, ride_id)` → `ride_stops(id, ride_id)`

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `ride_id` | UUID | **FK** | No | `Yes — ride price loading` | Link to trip. |
| `start_stop_id` | UUID | **FK** | No | `Yes — segment uniqueness and joins` | Pickup stop. Must belong to `ride_id`. |
| `end_stop_id` | UUID | **FK** | No | `Yes — segment uniqueness and joins` | Drop-off stop. Must belong to `ride_id`. |
| `start_stop_order` | Integer | | No | `No` | Denormalized stop order. |
| `end_stop_order` | Integer | | No | `No` | Denormalized stop order. |
| `amount` | Decimal(10,2) | | No | `Optional — price filtering/sorting` | Segment price value. |
| `currency` | String(3) | | No | `No` | ISO 4217 currency code. |
| `created_at` | Timestamp | | No | `No` | Audit: Price creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last price update time. |

**MVP rule:**
For MVP, prices are stored only for segments explicitly offered by the driver. The system does not require a complete price definition for every possible stop pair.

---

## 6. Booking Entity (`bookings`)
*Passenger seat reservations between specific stops, including immutable pricing snapshots and cancellation metadata.*

**Constraints:**
* **`CHECK (pickup_stop_id <> dropoff_stop_id)`**
* **`CHECK (pickup_order < dropoff_order)`**
* **`CHECK (seat_count > 0)`**
* **`CHECK (price_amount >= 0)`**
* Composite FK `(pickup_stop_id, ride_id)` → `ride_stops(id, ride_id)`
* Composite FK `(dropoff_stop_id, ride_id)` → `ride_stops(id, ride_id)`
* Only one active booking per passenger per ride is allowed. “Active” means a non-deleted booking row representing the current booking record for that ride-passenger pair.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `passenger_id` | UUID | **FK** | No | `Yes — passenger booking lookup` | Refers to `users.id`. |
| `ride_id` | UUID | **FK** | No | `Yes — ride booking management` | Contextual trip. |
| `pickup_stop_id` | UUID | **FK** | No | `Optional — joins and validation` | Pickup stop. Must belong to `ride_id`. |
| `dropoff_stop_id` | UUID | **FK** | No | `Optional — joins and validation` | Drop-off stop. Must belong to `ride_id`. |
| `pickup_order` | Integer | | No | `Yes — segment capacity calculation` | Denormalized pickup `stop_order`. |
| `dropoff_order` | Integer | | No | `Yes — segment capacity calculation` | Denormalized drop-off `stop_order`. |
| `seat_count` | Integer | | No | `No` | Seats reserved. |
| `booking_status_id` | Integer | **FK** | No | `Yes — state filtering` | Refers to `booking_statuses.id`. |
| `price_amount` | Decimal(10,2) | | No | `Optional — reporting and sorting` | Immutable booking price snapshot. |
| `currency` | String(3) | | No | `No` | Immutable booking currency snapshot. |
| `confirmed_at` | Timestamp | | Yes | `Optional — state filtering` | Time booking was confirmed. |
| `cancelled_at` | Timestamp | | Yes | `Optional — state filtering` | Time booking was cancelled. |
| `cancelled_by_user_id` | UUID | **FK** | Yes | `Optional — audit lookup` | Actor initiating cancellation. |
| `cancellation_reason` | Text | | Yes | `No` | Optional human-readable reason. |
| `no_show_marked_at` | Timestamp | | Yes | `Optional — state filtering` | Time booking was marked no-show. |
| `created_at` | Timestamp | | No | `Yes — chronology and admin listing` | Audit: Reservation creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last booking update time. |
| `deleted_at` | Timestamp | | Yes | `Optional — active booking filtering` | Soft delete if business policy uses it. |

---

## 7. Review Entity (`reviews`)
*Peer-to-peer post-ride feedback with moderation-aware visibility and simple role support.*

**Constraints:**
* **`UNIQUE (ride_id, author_id, subject_id)`**
* **`CHECK (rating BETWEEN 1 AND 5)`**
* **`CHECK (author_id <> subject_id)`**
* Reviews may only be created after the ride is completed and only between users who were actual completed participants of that ride.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `ride_id` | UUID | **FK** | No | `Optional — contextual lookup` | Contextual trip ID. |
| `author_id` | UUID | **FK** | No | `Optional — moderation/audit lookup` | User giving the rating. |
| `subject_id` | UUID | **FK** | No | `Yes — reviews by subject` | User receiving the rating. |
| `rating` | Integer | | No | `Yes — sorting/analytics` | Score `1` to `5`. |
| `comment` | Text | | Yes | `No` | Qualitative feedback. |
| `review_status_id` | Integer | **FK** | No | `Optional — moderation filtering` | Refers to `review_statuses.id`. |
| `created_at` | Timestamp | | No | `Yes — chronology` | Audit: Review creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit: Last review update time. |

---

## 8. Conversation Entity (`conversations`)
*Stable thread container for direct communication between ride-related participants. Membership is explicitly stored in `conversation_participants`.*

**Constraints:**
* Conversation membership is enforced through `conversation_participants`.
* In MVP, conversations are intended primarily for direct participant messaging related to a ride or booking context.
* In standard ride messaging flows, a conversation should reference at least one contextual entity (`ride_id` or `booking_id`).

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `ride_id` | UUID | **FK** | Yes | `Yes — ride conversation lookup` | Related ride context. |
| `booking_id` | UUID | **FK** | Yes | `Yes — booking conversation lookup` | Related booking context. |
| `conversation_type_id` | Integer | **FK** | No | `Optional — type filtering` | Refers to `conversation_types.id`. |
| `created_at` | Timestamp | | No | `No` | Conversation creation time. |
| `updated_at` | Timestamp | | No | `Yes — thread ordering by latest activity` | Last activity time. |
| `deleted_at` | Timestamp | | Yes | `Optional — soft delete filtering` | Soft delete if applicable. |

---

## 9. Conversation Participant Entity (`conversation_participants`)
*Defines membership of users in conversations and supports access control and per-user read tracking.*

**Constraints:**
* **`UNIQUE (conversation_id, user_id)`**
* Conversation must contain at least two participants unless explicitly used for support or system workflows.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `conversation_id` | UUID | **FK** | No | `Yes — membership lookup` | Refers to `conversations.id`. |
| `user_id` | UUID | **FK** | No | `Yes — user conversation lookup` | Refers to `users.id`. |
| `joined_at` | Timestamp | | No | `No` | Time user became a participant. |
| `last_read_at` | Timestamp | | Yes | `Optional — unread/read detection` | Per-user read marker for the conversation. |
| `is_muted` | Boolean | | No | `Optional — user conversation settings` | Whether notifications are muted for this conversation. |
| `created_at` | Timestamp | | No | `No` | Audit creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit update time. |

---

## 10. Message Entity (`messages`)
*Internal conversation messages with simple edit and soft-delete support. The MVP messaging model is intentionally limited and uses conversation-level read tracking instead of per-message delivery state.*

**Constraints:**
* Sender must be a member of the conversation.
* Message visibility is restricted to conversation participants.
* Soft deletion is global at the message row level in MVP.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique message ID. |
| `conversation_id` | UUID | **FK** | No | `Yes — thread loading` | Refers to `conversations.id`. |
| `sender_id` | UUID | **FK** | No | `Yes — sender history and audit` | Message author; must belong to conversation participants. |
| `message_type_id` | Integer | **FK** | No | `No` | Refers to `message_types.id`. |
| `content` | Text | | No | `Optional — text search` | Message body. |
| `sent_at` | Timestamp | | No | `Yes — chronological thread loading` | Sent timestamp. |
| `edited_at` | Timestamp | | Yes | `No` | Edit timestamp. |
| `deleted_at` | Timestamp | | Yes | `Optional — soft delete filtering` | Soft delete timestamp. |
| `created_at` | Timestamp | | No | `No` | Audit creation time. |
| `updated_at` | Timestamp | | No | `No` | Audit update time. |

---

## 11. Notification Entity (`notifications`)
*Tracks internal notification delivery for app inbox and future orchestration.*

**Constraints:**
* Notification fan-out may later be extended into provider-specific delivery tables if needed.
* `messages` represent user communication inside conversations, while `notifications` represent system-generated alerts outside the conversation thread model.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `user_id` | UUID | **FK** | No | `Yes — recipient inbox lookup` | Notification recipient. |
| `notification_type_id` | Integer | **FK** | No | `Optional — type filtering` | Refers to `notification_types.id`. |
| `reference_entity_type` | String | | Yes | `Optional — source tracing` | Related logical entity name. |
| `reference_entity_id` | UUID | | Yes | `Optional — source tracing` | Related entity row ID. |
| `title` | String | | No | `No` | Notification title. |
| `body` | Text | | No | `No` | Notification body. |
| `delivery_status_id` | Integer | **FK** | No | `Yes — delivery state filtering` | Refers to `notification_delivery_statuses.id`. |
| `read_at` | Timestamp | | Yes | `Yes — unread/read filtering` | In-app read time. |
| `sent_at` | Timestamp | | Yes | `Optional — delivery tracking` | Delivery dispatch time. |
| `created_at` | Timestamp | | No | `Yes — inbox ordering` | Notification creation time. |
| `updated_at` | Timestamp | | No | `No` | Last delivery state update. |

---

## 12. User Status History (`user_status_history`)
*Tracks user moderation and activation lifecycle changes.*

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `user_id` | UUID | **FK** | No | `Yes — user history lookup` | Refers to `users.id`. |
| `old_status_id` | Integer | **FK** | Yes | `No` | Previous status from `user_statuses.id`. |
| `new_status_id` | Integer | **FK** | No | `Optional — state filtering` | New status from `user_statuses.id`. |
| `changed_by_user_id` | UUID | **FK** | Yes | `Optional — audit lookup` | Actor who performed the change. |
| `reason` | Text | | Yes | `No` | Optional reason for moderation or activation change. |
| `created_at` | Timestamp | | No | `Yes — chronology` | Audit: Status change time. |

---

## 13. Ride Status History (`ride_status_history`)
*Tracks ride lifecycle changes such as planning, cancellation, and completion.*

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `ride_id` | UUID | **FK** | No | `Yes — ride history lookup` | Refers to `rides.id`. |
| `old_status_id` | Integer | **FK** | Yes | `No` | Previous status from `ride_statuses.id`. |
| `new_status_id` | Integer | **FK** | No | `Optional — state filtering` | New status from `ride_statuses.id`. |
| `changed_by_user_id` | UUID | **FK** | Yes | `Optional — audit lookup` | Actor who performed the change. |
| `reason` | Text | | Yes | `No` | Optional reason for cancellation or status change. |
| `created_at` | Timestamp | | No | `Yes — chronology` | Audit: Status change time. |

---

## 14. Booking Status History (`booking_status_history`)
*Tracks booking lifecycle changes such as confirmation, rejection, cancellation, and no-show handling.*

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | **PK** | No | `Yes — primary key` | Unique identifier. |
| `booking_id` | UUID | **FK** | No | `Yes — booking history lookup` | Refers to `bookings.id`. |
| `old_status_id` | Integer | **FK** | Yes | `No` | Previous status from `booking_statuses.id`. |
| `new_status_id` | Integer | **FK** | No | `Optional — state filtering` | New status from `booking_statuses.id`. |
| `changed_by_user_id` | UUID | **FK** | Yes | `Optional — audit lookup` | Actor who performed the change. |
| `reason` | Text | | Yes | `No` | Optional reason for rejection, cancellation, or no-show. |
| `created_at` | Timestamp | | No | `Yes — chronology` | Audit: Status change time. |

---

## 15. Lookup Tables (3NF)
*Centralized enumerations and reference dimensions.*

* `user_statuses`: `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED`
* `ride_statuses`: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
* `booking_statuses`: `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
* `review_statuses`: `VISIBLE`, `HIDDEN`, `REMOVED`
* `conversation_types`: `RIDE`, `BOOKING`, `SUPPORT`
* `message_types`: `TEXT`, `SYSTEM`
* `notification_types`: `BOOKING_REQUEST`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `MESSAGE_RECEIVED`, `RIDE_UPDATED`, `REVIEW_RECEIVED`
* `notification_delivery_statuses`: `PENDING`, `SENT`, `FAILED`, `READ`
* `car_models`: centralized brand/model repository

---

## 16. Integrity & Concurrency Logic

### 16.1 Capacity Control (Race Condition Prevention)
To prevent overbooking, seat confirmation should occur within a serializable transaction using pessimistic locking.

Because bookings are segment-based, capacity must be validated across the requested interval, not by summing all confirmed seats on the entire ride. The system must ensure that the maximum concurrent seat usage across all overlapping segments does not exceed `cars.seats_total`.

**Required flow:**
1. `SELECT seats_total FROM cars WHERE id = ? FOR UPDATE;`
2. Lock relevant active bookings for the ride.
3. Compute overlapping occupancy for all segments between `pickup_order` and `dropoff_order`.
4. If `max_segment_occupancy + requested_seat_count <= seats_total`, insert or confirm booking and commit.
5. Refresh `rides.available_seats_cached` atomically or within the same committed workflow.

### 16.2 Rating Synchronization
When a row is inserted, updated, hidden, or removed in `reviews`, the aggregates in `users.avg_rating` and `users.rating_count` must be synchronized via trigger or within the same application transaction.

### 16.3 Stop-to-Ride Integrity
For both `prices` and `bookings`, stop consistency must be enforced at the database level through composite foreign keys referencing `ride_stops(id, ride_id)`.

### 16.4 Denormalized Stop Order Synchronization
For both `prices` and `bookings`, denormalized stop order columns must be written atomically and remain synchronized with the referenced stops.

### 16.5 Search Field Synchronization
Search fields on `rides` must be refreshed whenever:
* ride boundary stops change
* ride departure time changes
* ride status changes
* price graph changes if ride-level cached values depend on them
* seat availability changes

### 16.6 Messaging Access Control
Conversation membership must be enforced through `conversation_participants`.

A user may send a message only if:
* the user is an active participant of the conversation,
* the related ride or booking is visible to that user,
* the user account is not suspended or banned.

Conversation read state in MVP is tracked via `conversation_participants.last_read_at` rather than per-message recipient delivery rows.

---

## 17. Audit & History Rules

### 17.1 Minimum Audit Columns
All core business entities should maintain `created_at` and `updated_at`. Soft-deletable entities should also maintain `deleted_at`.

### 17.2 Append-Only History
Status history tables should be append-only. Existing history rows should never be updated or deleted except under extraordinary administrative procedures.

### 17.3 Actor Tracking
Whenever possible, changes should record the acting user via `changed_by_user_id`. System-generated changes may use `NULL` or a dedicated system actor.

### 17.4 Current State vs Historical State
Main entity tables represent the current state. Historical reconstruction should rely on:
* status history tables for lifecycle transitions
* entity timestamps and snapshot fields for lightweight auditability

### 17.5 Transactional Consistency
For status changes, both the current-state row and corresponding history row must be written within the same database transaction.