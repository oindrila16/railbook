/**
 * User data access layer.
 */
const pool = require('../config/database');

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findByPhone(phone) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE phone = ? LIMIT 1',
    [phone]
  );
  return rows[0] || null;
}

async function findByEmailOrPhone(email, phone) {
  if (email) return findByEmail(email);
  return findByPhone(phone);
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, email, phone, full_name, role, is_verified, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create({ email, phone, passwordHash, fullName, role = 'user' }) {
  const [result] = await pool.query(
    `INSERT INTO users (email, phone, password_hash, full_name, role, is_verified)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [email || null, phone || null, passwordHash, fullName, role]
  );
  return findById(result.insertId);
}

async function upsertAdmin({ email, passwordHash, fullName }) {
  const existing = await findByEmail(email);
  if (existing) {
    await pool.query(
      `UPDATE users SET password_hash = ?, full_name = ?, role = 'admin', is_verified = 1, is_active = 1 WHERE id = ?`,
      [passwordHash, fullName, existing.id]
    );
    return findById(existing.id);
  }
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active)
     VALUES (?, ?, ?, 'admin', 1, 1)`,
    [email, passwordHash, fullName]
  );
  return findById(result.insertId);
}

async function listAll(limit = 100) {
  const [rows] = await pool.query(
    `SELECT id, email, phone, full_name, role, is_verified, is_active, created_at
     FROM users ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [passwordHash, userId]
  );
}

async function markVerified(userId) {
  await pool.query(
    'UPDATE users SET is_verified = 1, updated_at = NOW() WHERE id = ?',
    [userId]
  );
}

/** Full row including password_hash — login only */
async function findByEmailOrPhoneWithPassword(email, phone) {
  const [rows] = await pool.query(
    `SELECT * FROM users
     WHERE (? IS NOT NULL AND email = ?)
        OR (? IS NOT NULL AND phone = ?)
     LIMIT 1`,
    [email, email, phone, phone]
  );
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  findByPhone,
  findByEmailOrPhone,
  findById,
  create,
  upsertAdmin,
  listAll,
  updatePassword,
  markVerified,
  findByEmailOrPhoneWithPassword,
};
