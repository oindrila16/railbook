-- All three fare classes require a seat. Keep the rule in MySQL as well as the API.
SET @sql = (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE trains DROP CHECK chk_trains_seats, ADD CONSTRAINT chk_trains_seats CHECK (total_seats >= 3)',
    'ALTER TABLE trains ADD CONSTRAINT chk_trains_seats CHECK (total_seats >= 3)')
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'trains'
    AND CONSTRAINT_NAME = 'chk_trains_seats' AND CONSTRAINT_TYPE = 'CHECK'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
