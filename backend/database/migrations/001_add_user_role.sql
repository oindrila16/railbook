-- Add user roles for admin access
ALTER TABLE users
  ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER full_name;

CREATE INDEX idx_users_role ON users (role);
