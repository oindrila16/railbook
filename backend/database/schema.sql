-- =============================================================================
-- Train Ticket Booking Platform — MySQL Schema
-- MySQL 8.0+ | InnoDB | utf8mb4
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(255)    NULL,
  phone           VARCHAR(20)     NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  full_name       VARCHAR(150)    NOT NULL,
  role            ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_verified     TINYINT(1)      NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  KEY idx_users_role (role),
  KEY idx_users_verified (is_verified),
  KEY idx_users_active (is_active),

  CONSTRAINT chk_users_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- otp_verifications — temporary OTP storage (5 min expiry enforced in app)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NULL,
  email           VARCHAR(255)    NULL,
  phone           VARCHAR(20)     NULL,
  otp_code        CHAR(6)         NOT NULL,
  purpose         ENUM('registration', 'login', 'password_reset') NOT NULL DEFAULT 'registration',
  expires_at      DATETIME        NOT NULL,
  is_used         TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_otp_user (user_id),
  KEY idx_otp_email (email),
  KEY idx_otp_phone (phone),
  KEY idx_otp_expires (expires_at),
  KEY idx_otp_lookup (email, phone, purpose, is_used),

  CONSTRAINT fk_otp_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT chk_otp_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- stations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stations (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(150)    NOT NULL,
  code            VARCHAR(10)     NOT NULL,
  city            VARCHAR(100)    NOT NULL,
  state           VARCHAR(100)    NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_stations_code (code),
  KEY idx_stations_city (city),
  KEY idx_stations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- trains
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trains (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  train_number    VARCHAR(20)     NOT NULL,
  name            VARCHAR(200)    NOT NULL,
  total_seats     INT UNSIGNED    NOT NULL,
  base_price      DECIMAL(10, 2)  NOT NULL,
  train_class     ENUM('AC', 'Sleeper', 'General', 'Executive') NOT NULL DEFAULT 'Sleeper',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_trains_number (train_number),
  KEY idx_trains_active (is_active),
  KEY idx_trains_class (train_class),

  CONSTRAINT chk_trains_seats CHECK (total_seats > 0),
  CONSTRAINT chk_trains_price CHECK (base_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- routes — train schedule between two stations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  train_id              BIGINT UNSIGNED NOT NULL,
  source_station_id     BIGINT UNSIGNED NOT NULL,
  destination_station_id BIGINT UNSIGNED NOT NULL,
  departure_time        TIME            NOT NULL,
  arrival_time          TIME            NOT NULL,
  duration_minutes      INT UNSIGNED    NOT NULL,
  distance_km           DECIMAL(8, 2)   NULL,
  is_active             TINYINT(1)      NOT NULL DEFAULT 1,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_route_train_stations (train_id, source_station_id, destination_station_id),
  KEY idx_routes_train (train_id),
  KEY idx_routes_source (source_station_id),
  KEY idx_routes_destination (destination_station_id),
  KEY idx_routes_search (source_station_id, destination_station_id, is_active),
  KEY idx_routes_active (is_active),

  CONSTRAINT fk_routes_train
    FOREIGN KEY (train_id) REFERENCES trains (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_routes_source
    FOREIGN KEY (source_station_id) REFERENCES stations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_routes_destination
    FOREIGN KEY (destination_station_id) REFERENCES stations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- route_fares — Economy / Business / First Class pricing per route
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_fares (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_id        BIGINT UNSIGNED NOT NULL,
  fare_class      ENUM('economy', 'business', 'first') NOT NULL,
  base_price      DECIMAL(10, 2)  NOT NULL,
  seat_quota      INT UNSIGNED    NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_route_fare_class (route_id, fare_class),
  KEY idx_route_fares_route (route_id),

  CONSTRAINT fk_route_fares_route
    FOREIGN KEY (route_id) REFERENCES routes (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT chk_route_fares_price CHECK (base_price >= 0),
  CONSTRAINT chk_route_fares_quota CHECK (seat_quota > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- bookings — one booking per transaction; travel_date drives seat availability
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_reference   VARCHAR(20)     NOT NULL,
  user_id             BIGINT UNSIGNED NOT NULL,
  route_id            BIGINT UNSIGNED NOT NULL,
  travel_date         DATE            NOT NULL,
  status              ENUM('pending', 'confirmed', 'cancelled', 'waitlisted') NOT NULL DEFAULT 'pending',
  total_amount        DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
  seat_count          INT UNSIGNED    NOT NULL DEFAULT 0,
  fare_class          ENUM('economy', 'business', 'first') NOT NULL DEFAULT 'economy',
  base_price_snapshot DECIMAL(10, 2)  NULL COMMENT 'Train base price at booking time',
  final_price_snapshot DECIMAL(10, 2) NULL COMMENT 'Price after dynamic pricing',
  pricing_factor      DECIMAL(5, 2)   NULL COMMENT 'Multiplier applied (e.g. 1.20)',
  pricing_breakdown   JSON            NULL COMMENT 'Full dynamic pricing breakdown at booking time',
  cancelled_at        DATETIME        NULL,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_bookings_reference (booking_reference),
  KEY idx_bookings_user (user_id),
  KEY idx_bookings_route_date (route_id, travel_date),
  KEY idx_bookings_status (status),
  KEY idx_bookings_user_status (user_id, status),
  KEY idx_bookings_travel_date (travel_date),

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_bookings_route
    FOREIGN KEY (route_id) REFERENCES routes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_bookings_seat_count CHECK (seat_count >= 0),
  CONSTRAINT chk_bookings_amount CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tickets — passenger + seat; denormalized route/date for unique seat constraint
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id        BIGINT UNSIGNED NOT NULL,
  route_id          BIGINT UNSIGNED NOT NULL,
  travel_date       DATE            NOT NULL,
  passenger_name    VARCHAR(150)    NOT NULL,
  passenger_age     TINYINT UNSIGNED NOT NULL,
  passenger_gender  ENUM('male', 'female', 'other') NOT NULL,
  seat_number       VARCHAR(10)     NOT NULL,
  ticket_price      DECIMAL(10, 2)  NOT NULL,
  fare_class        ENUM('economy', 'business', 'first') NOT NULL DEFAULT 'economy',
  status            ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_ticket_seat_trip (route_id, travel_date, seat_number),
  KEY idx_tickets_booking (booking_id),
  KEY idx_tickets_route_date (route_id, travel_date),
  KEY idx_tickets_status (status),
  KEY idx_tickets_travel_date (travel_date),

  CONSTRAINT fk_tickets_booking
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_tickets_route
    FOREIGN KEY (route_id) REFERENCES routes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_tickets_age CHECK (passenger_age > 0 AND passenger_age <= 120),
  CONSTRAINT chk_tickets_price CHECK (ticket_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- waitlist — FIFO queue per route + travel_date
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  route_id        BIGINT UNSIGNED NOT NULL,
  travel_date     DATE            NOT NULL,
  position        INT UNSIGNED    NOT NULL,
  passenger_count INT UNSIGNED    NOT NULL DEFAULT 1,
  passengers_json JSON            NULL COMMENT 'Passenger snapshot for auto-promotion on cancel',
  status          ENUM('waiting', 'confirmed', 'cancelled', 'expired') NOT NULL DEFAULT 'waiting',
  booking_id      BIGINT UNSIGNED NULL COMMENT 'Set when promoted from waitlist',
  notified_at     DATETIME        NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_waitlist_user_trip (user_id, route_id, travel_date),
  KEY idx_waitlist_route_date (route_id, travel_date),
  KEY idx_waitlist_queue (route_id, travel_date, status, position),
  KEY idx_waitlist_user (user_id),
  KEY idx_waitlist_status (status),

  CONSTRAINT fk_waitlist_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_waitlist_route
    FOREIGN KEY (route_id) REFERENCES routes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_waitlist_booking
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT chk_waitlist_position CHECK (position > 0),
  CONSTRAINT chk_waitlist_passengers CHECK (passenger_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Helpful views for seat availability & recommendations (read-only)
-- =============================================================================

CREATE OR REPLACE VIEW v_route_booked_seats AS
SELECT
  t.route_id,
  t.travel_date,
  COUNT(*) AS booked_seats
FROM tickets t
INNER JOIN bookings b ON b.id = t.booking_id
WHERE t.status = 'active'
  AND b.status IN ('confirmed', 'pending')
GROUP BY t.route_id, t.travel_date;

CREATE OR REPLACE VIEW v_popular_routes AS
SELECT
  r.id AS route_id,
  r.source_station_id,
  r.destination_station_id,
  r.train_id,
  COUNT(b.id) AS booking_count
FROM bookings b
INNER JOIN routes r ON r.id = b.route_id
WHERE b.status = 'confirmed'
GROUP BY r.id, r.source_station_id, r.destination_station_id, r.train_id
ORDER BY booking_count DESC;
