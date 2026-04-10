# Data Entity Specification

This document reflects the revised ERD in `documentation/database_specification/erd_revised/erd.puml`.

---

## 1. User Entity (`users`)

Primary participant registry for identity, profile, and account lifecycle state.

**Constraints:**

- `UNIQUE INDEX ON lower(email)`
- `CHECK (char_length(email) <= 254)`
- `CHECK (char_length(password_hash) BETWEEN 1 AND 255)`
- `CHECK (char_length(first_name) BETWEEN 1 AND 20)`
- `CHECK (char_length(last_name) BETWEEN 1 AND 20)`
- `CHECK (char_length(display_name) BETWEEN 1 AND 20)`
- `CHECK (first_name ~ '^[[:upper:]]' AND first_name !~ '\s')`
- `CHECK (last_name ~ '^[[:upper:]]' AND last_name !~ '\s')`
- `CHECK (display_name !~ '\s')`
- `CHECK (phone IS NULL OR (phone ~ '^\+[1-9][0-9]{1,14}$' AND char_length(phone) <= 16))`
- `CHECK (bio IS NULL OR char_length(bio) <= 500)`

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `email` | String |  | No | Yes (unique) | Login credential. |
| `password_hash` | String |  | No | No | Secure password hash. |
| `first_name` | String |  | No | No | User first name. |
| `last_name` | String |  | No | No | User last name. |
| `display_name` | String |  | No | Optional | Public profile name. |
| `phone` | String |  | Yes | Optional | Contact phone number. |
| `profile_photo_url` | String |  | Yes | No | Profile image URL. |
| `bio` | Text |  | Yes | No | Optional profile text. |
| `email_verified_at` | Timestamp |  | Yes | Optional | Email verification timestamp. |
| `phone_verified_at` | Timestamp |  | Yes | Optional | Phone verification timestamp. |
| `last_active_at` | Timestamp |  | Yes | Optional | Last seen activity. |
| `user_status` | String |  | No | Yes | Account status value. |
| `created_at` | Timestamp |  | No | Yes | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |

---

## 2. Car Model Entity (`car_models`)

Reference list of vehicle brands and model names.

**Constraints:**

- `UNIQUE (brand, model_name)`
- `CHECK (char_length(brand) BETWEEN 1 AND 100)`
- `CHECK (char_length(model_name) BETWEEN 1 AND 100)`

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | Integer | **PK** | No | Yes | Unique identifier. |
| `brand` | String |  | No | Yes | Vehicle manufacturer brand. |
| `model_name` | String |  | No | Yes | Vehicle model name. |

---

## 3. Car Entity (`cars`)

Vehicles owned by users and used for ride publishing.

**Constraints:**

- `UNIQUE (spz, country_code)`
- `CHECK (seats_total > 0)`
- `CHECK (char_length(spz) BETWEEN 1 AND 16)`
- `CHECK (country_code ~ '^[A-Z]{3}$')`
- `CHECK (color IS NULL OR char_length(color) BETWEEN 1 AND 50)`

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `owner_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `model_id` | Integer | **FK** | No | Yes | Refers to `car_models.id`. |
| `spz` | String |  | No | Yes | License plate value. |
| `country_code` | String(3) |  | No | Yes | ISO 3166-1 alpha-3 country code. |
| `color` | String |  | Yes | No | Vehicle color. |
| `seats_total` | Integer |  | No | No | Total physical seat capacity. |
| `is_active` | Boolean |  | No | Optional | Car can be used for new rides. |
| `created_at` | Timestamp |  | No | Optional | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |

---

## 4. Ride Entity (`rides`)

Core ride publication data.

**Constraints:**

- `CHECK (offered_seats > 0)`
- `CHECK (arrival_estimate_at IS NULL OR arrival_estimate_at >= departure_at)`
- `CHECK (currency ~ '^[A-Z]{3}$')`
- `CHECK (description IS NULL OR char_length(description) <= 500)`
- `offered_seats` should not exceed related `cars.seats_total`.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique ride ID. |
| `driver_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `car_id` | UUID | **FK** | No | Yes | Refers to `cars.id`. |
| `departure_at` | Timestamp |  | No | Yes | Planned departure time. |
| `arrival_estimate_at` | Timestamp |  | Yes | Optional | Estimated arrival time. |
| `ride_status` | String |  | No | Yes | Current ride status value. |
| `offered_seats` | Integer |  | No | Yes | Seats offered for booking. |
| `currency` | String(3) |  | No | No | ISO 4217 currency code. |
| `description` | Text |  | Yes | Optional | Optional ride note. |
| `created_at` | Timestamp |  | No | Yes | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |

---

## 5. Ride Stop Entity (`ride_stops`)

Ordered route stops for each ride.

**Constraints:**

- `UNIQUE (ride_id, stop_order)`
- `CHECK (stop_order >= 0)`
- `CHECK (lat BETWEEN -90 AND 90)`
- `CHECK (lng BETWEEN -180 AND 180)`
- `CHECK (char_length(address) BETWEEN 1 AND 255)`
- `CHECK (char_length(city) BETWEEN 1 AND 100)`
- `CHECK (planned_arrival_at IS NULL OR planned_departure_at IS NULL OR planned_departure_at >= planned_arrival_at)`
- `CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{3}$')`
- City values are trimmed and must not contain control characters (enforced in input validation; DB expression can vary by collation/encoding).

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique stop ID. |
| `ride_id` | UUID | **FK** | No | Yes | Refers to `rides.id`. |
| `address` | String |  | No | No | Human-readable location address. |
| `city` | String |  | No | Yes | City label used for search/filtering. |
| `country_code` | String(3) |  | Yes | Yes | ISO 3166-1 alpha-3 country code. |
| `lat` | Decimal(9,6) |  | No | Yes | Latitude. |
| `lng` | Decimal(9,6) |  | No | Yes | Longitude. |
| `stop_order` | Integer |  | No | Yes | Ordered position in route (`0` origin). |
| `planned_arrival_at` | Timestamp |  | Yes | Optional | Planned arrival at stop. |
| `planned_departure_at` | Timestamp |  | Yes | Optional | Planned departure from stop. |
| `created_at` | Timestamp |  | No | No | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |

---

## 6. Price Entity (`prices`)

Published prices for ride stop-to-stop segments.

**Constraints:**

- `UNIQUE (ride_id, start_stop_id, end_stop_id)`
- `CHECK (amount >= 0)`
- `CHECK (amount <= 99999999.99)`
- `CHECK (amount = round(amount, 2))`
- `CHECK (start_stop_id <> end_stop_id)`
- `CHECK (currency ~ '^[A-Z]{3}$')`
- Segment order (`start_stop` before `end_stop`) must be validated by DB logic or application logic.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `ride_id` | UUID | **FK** | No | Yes | Refers to `rides.id`. |
| `start_stop_id` | UUID | **FK** | No | Yes | Refers to `ride_stops.id`. |
| `end_stop_id` | UUID | **FK** | No | Yes | Refers to `ride_stops.id`. |
| `amount` | Decimal(10,2) |  | No | Optional | Segment price value. |
| `currency` | String(3) |  | No | No | ISO 4217 currency code. |
| `created_at` | Timestamp |  | No | No | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |

---

## 7. Booking Entity (`bookings`)

Passenger reservations for specific ride segments.

**Constraints:**

- `CHECK (pickup_stop_id <> dropoff_stop_id)`
- `CHECK (seat_count > 0)`
- `CHECK (price_amount >= 0)`
- `CHECK (price_amount <= 99999999.99)`
- `CHECK (price_amount = round(price_amount, 2))`
- `CHECK (cancellation_reason IS NULL OR char_length(cancellation_reason) <= 500)`
- `CHECK (currency ~ '^[A-Z]{3}$')`
- `CHECK (seat_count = floor(seat_count))`
- Pickup stop must be before dropoff stop by `ride_stops.stop_order`.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `passenger_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `ride_id` | UUID | **FK** | No | Yes | Refers to `rides.id`. |
| `pickup_stop_id` | UUID | **FK** | No | Yes | Pickup stop (`ride_stops.id`). |
| `dropoff_stop_id` | UUID | **FK** | No | Yes | Dropoff stop (`ride_stops.id`). |
| `seat_count` | Integer |  | No | No | Number of reserved seats. |
| `booking_status` | String |  | No | Yes | Current booking status value. |
| `price_amount` | Decimal(10,2) |  | No | Optional | Price snapshot at booking time. |
| `currency` | String(3) |  | No | No | Currency snapshot (ISO 4217). |
| `confirmed_at` | Timestamp |  | Yes | Optional | Confirmation timestamp. |
| `cancelled_at` | Timestamp |  | Yes | Optional | Cancellation timestamp. |
| `cancelled_by_user_id` | UUID | **FK** | Yes | Optional | Refers to `users.id`. |
| `cancellation_reason` | Text |  | Yes | No | Optional cancellation reason. |
| `no_show_marked_at` | Timestamp |  | Yes | Optional | No-show marking timestamp. |
| `created_at` | Timestamp |  | No | Yes | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |

---

## 8. Review Entity (`reviews`)

Post-ride user feedback.

**Constraints:**

- `UNIQUE (ride_id, author_id, subject_id)`
- `CHECK (rating BETWEEN 1 AND 5)`
- `CHECK (author_id <> subject_id)`

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `ride_id` | UUID | **FK** | No | Yes | Refers to `rides.id`. |
| `author_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `subject_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `rating` | Integer |  | No | Yes | Integer score (`1..5`). |
| `comment` | Text |  | Yes | No | Optional feedback text. |
| `review_status` | String |  | No | Yes | Current review status value. |
| `created_at` | Timestamp |  | No | Yes | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |

---

## 9. Conversation Entity (`conversations`)

Thread container for ride/booking context communication.

**Constraints:**

- At least one context reference should be present (`ride_id` or `booking_id`).

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique conversation ID. |
| `ride_id` | UUID | **FK** | Yes | Yes | Refers to `rides.id`. |
| `booking_id` | UUID | **FK** | Yes | Yes | Refers to `bookings.id`. |
| `conversation_type` | String |  | No | Yes | Conversation type value. |
| `driver_last_read_at` | Timestamp |  | Yes | Optional | Driver read marker. |
| `passenger_last_read_at` | Timestamp |  | Yes | Optional | Passenger read marker. |
| `created_at` | Timestamp |  | No | No | Record creation time. |
| `updated_at` | Timestamp |  | No | Yes | Last activity time. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |

---

## 10. Message Entity (`messages`)

Messages exchanged inside conversations.

**Constraints:**

- Sender must be a valid participant of the conversation context.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique message ID. |
| `conversation_id` | UUID | **FK** | No | Yes | Refers to `conversations.id`. |
| `sender_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `message_type` | String |  | No | Optional | Message type value. |
| `content` | Text |  | No | Optional | Message body. |
| `sent_at` | Timestamp |  | No | Yes | Sent timestamp. |
| `edited_at` | Timestamp |  | Yes | No | Last edit timestamp. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |
| `created_at` | Timestamp |  | No | No | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |

---

## 11. Notification Entity (`notifications`)

Internal notification delivery records.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `user_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `notification_type` | String |  | No | Yes | Notification type value. |
| `reference_entity_type` | String |  | Yes | Optional | Related entity type label. |
| `reference_entity_id` | UUID |  | Yes | Optional | Related entity ID. |
| `title` | String |  | No | No | Notification title. |
| `body` | Text |  | No | No | Notification content. |
| `delivery_status` | String |  | No | Yes | Delivery status value. |
| `read_at` | Timestamp |  | Yes | Yes | Read timestamp. |
| `sent_at` | Timestamp |  | Yes | Optional | Dispatch timestamp. |
| `created_at` | Timestamp |  | No | Yes | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |

---

## 12. User Status History Entity (`user_status_history`)

Append-only history of user status transitions.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `user_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `old_status` | String |  | Yes | No | Previous status value. |
| `new_status` | String |  | No | Yes | New status value. |
| `changed_by_user_id` | UUID | **FK** | Yes | Optional | Refers to `users.id`. |
| `reason` | Text |  | Yes | No | Optional change reason. |
| `created_at` | Timestamp |  | No | Yes | Change timestamp. |

---

## 13. Ride Status History Entity (`ride_status_history`)

Append-only history of ride status transitions.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `ride_id` | UUID | **FK** | No | Yes | Refers to `rides.id`. |
| `old_status` | String |  | Yes | No | Previous status value. |
| `new_status` | String |  | No | Yes | New status value. |
| `changed_by_user_id` | UUID | **FK** | Yes | Optional | Refers to `users.id`. |
| `reason` | Text |  | Yes | No | Optional change reason. |
| `created_at` | Timestamp |  | No | Yes | Change timestamp. |

---

## 14. Booking Status History Entity (`booking_status_history`)

Append-only history of booking status transitions.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `booking_id` | UUID | **FK** | No | Yes | Refers to `bookings.id`. |
| `old_status` | String |  | Yes | No | Previous status value. |
| `new_status` | String |  | No | Yes | New status value. |
| `changed_by_user_id` | UUID | **FK** | Yes | Optional | Refers to `users.id`. |
| `reason` | Text |  | Yes | No | Optional change reason. |
| `created_at` | Timestamp |  | No | Yes | Change timestamp. |

---

## 15. Blocklist Entity (`blocklist`)

Directed user-to-user blocking records used for trust and safety enforcement.

**Constraints:**

- `CHECK (blocker_user_id <> blocked_user_id)`
- `CHECK (revoked_at IS NULL OR revoked_at >= created_at)`
- `CHECK (reason_text IS NULL OR length(trim(reason_text)) <= 500)`
- One active block per directed pair is recommended.

| Attribute | Type | PK/FK | Nullable | Indexed | Description |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `id` | UUID | **PK** | No | Yes | Unique identifier. |
| `blocker_user_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `blocked_user_id` | UUID | **FK** | No | Yes | Refers to `users.id`. |
| `block_reason` | String |  | No | Yes | Block reason value. |
| `block_status` | String |  | No | Yes | Block status value. |
| `reason_text` | Text |  | Yes | No | Optional free-text explanation. |
| `revoked_at` | Timestamp |  | Yes | Optional | Block revocation timestamp. |
| `revoked_by_user_id` | UUID | **FK** | Yes | Optional | Refers to `users.id`. |
| `created_at` | Timestamp |  | No | Yes | Record creation time. |
| `updated_at` | Timestamp |  | No | No | Last update time. |
| `deleted_at` | Timestamp |  | Yes | Optional | Soft-delete timestamp. |

---

## 16. Integrity and Concurrency Rules

### 16.1 Capacity Control

Booking confirmation should run inside one transaction with locking to avoid overbooking.

Recommended flow:

1. Lock relevant ride and active ride bookings.
2. Compute overlapping segment occupancy from bookings and `ride_stops.stop_order`.
3. Confirm only if `max_segment_occupancy + requested_seat_count <= rides.offered_seats`.
4. Write current booking status plus history row in the same transaction.

### 16.2 Stop Consistency

For `prices` and `bookings`, stop IDs must belong to the same `ride_id` and preserve correct segment order.

### 16.3 Status and History Consistency

When `user_status`, `ride_status`, or `booking_status` changes, insert a row into the corresponding history table in the same transaction.

### 16.4 Messaging Access Control

A message can be sent only if sender belongs to conversation context and block policy does not prohibit communication.

### 16.5 Blocklist Enforcement

At runtime, interaction checks should be bidirectional: if active block exists in either direction between two users, new direct interaction should be denied.

---

## 17. Audit Rules

### 17.1 Minimum Audit Columns

All core entities keep `created_at` and `updated_at`. Soft-deletable entities also keep `deleted_at`.

### 17.2 Append-Only History

History entities (`user_status_history`, `ride_status_history`, `booking_status_history`) are append-only.

### 17.3 Actor Tracking

Lifecycle changes should store `changed_by_user_id` where available. System actions may use `NULL`.

---

## 18. Enumerations (Application-Level)

In revised ERD, status/type columns are string values stored directly in business tables. Controlled vocabularies should be enforced in application/domain logic and optionally by DB `CHECK` constraints.
