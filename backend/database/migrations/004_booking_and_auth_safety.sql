-- Preserve historical rows while enforcing uniqueness only for active reservations.

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE tickets ADD COLUMN active_seat_number VARCHAR(10) GENERATED ALWAYS AS (CASE WHEN status = ''active'' THEN seat_number ELSE NULL END) STORED', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'active_seat_number');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE waitlist ADD COLUMN waiting_marker TINYINT GENERATED ALWAYS AS (CASE WHEN status = ''waiting'' THEN 1 ELSE NULL END) STORED', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'waitlist' AND COLUMN_NAME = 'waiting_marker');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE otp_verifications ADD COLUMN attempts TINYINT UNSIGNED NOT NULL DEFAULT 0', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otp_verifications' AND COLUMN_NAME = 'attempts');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE otp_verifications ADD COLUMN pending_password_hash VARCHAR(255) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otp_verifications' AND COLUMN_NAME = 'pending_password_hash');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE tickets DROP INDEX uk_ticket_seat_trip, ADD UNIQUE INDEX uk_ticket_seat_trip (route_id, travel_date, active_seat_number)', 'SELECT 1') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND INDEX_NAME = 'uk_ticket_seat_trip' AND COLUMN_NAME = 'active_seat_number');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE waitlist DROP INDEX uk_waitlist_user_trip, ADD UNIQUE INDEX uk_waitlist_user_trip (user_id, route_id, travel_date, waiting_marker)', 'SELECT 1') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'waitlist' AND INDEX_NAME = 'uk_waitlist_user_trip' AND COLUMN_NAME = 'waiting_marker');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
