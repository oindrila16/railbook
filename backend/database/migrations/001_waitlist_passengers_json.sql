-- Run if database was created before passengers_json was added to waitlist
SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE waitlist ADD COLUMN passengers_json JSON NULL COMMENT ''Passenger snapshot for auto-promotion on cancel'' AFTER passenger_count',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'waitlist' AND COLUMN_NAME = 'passengers_json'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
