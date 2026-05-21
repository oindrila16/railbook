-- Fare classes: Economy, Business, First Class (run after initial schema)

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

-- Add fare_class to bookings/tickets if missing (idempotent for re-runs)
SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE bookings ADD COLUMN fare_class ENUM(''economy'', ''business'', ''first'') NOT NULL DEFAULT ''economy'' AFTER seat_count',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'fare_class'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE tickets ADD COLUMN fare_class ENUM(''economy'', ''business'', ''first'') NOT NULL DEFAULT ''economy'' AFTER ticket_price',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'fare_class'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
