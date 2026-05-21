/**
 * OTP verification data access layer.
 */
const pool = require('../config/database');

async function create({ userId, email, phone, otpCode, purpose, expiresAt }) {
  const [result] = await pool.query(
    `INSERT INTO otp_verifications (user_id, email, phone, otp_code, purpose, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, email || null, phone || null, otpCode, purpose, expiresAt]
  );
  return result.insertId;
}

/** Invalidate previous unused OTPs for the same contact + purpose */
async function invalidatePrevious({ email, phone, purpose }) {
  await pool.query(
    `UPDATE otp_verifications
     SET is_used = 1
     WHERE purpose = ?
       AND is_used = 0
       AND (
         (? IS NOT NULL AND email = ?)
         OR (? IS NOT NULL AND phone = ?)
       )`,
    [purpose, email, email, phone, phone]
  );
}

async function findValidOtp({ email, phone, otpCode, purpose }) {
  const [rows] = await pool.query(
    `SELECT * FROM otp_verifications
     WHERE otp_code = ?
       AND purpose = ?
       AND is_used = 0
       AND expires_at > NOW()
       AND (
         (? IS NOT NULL AND email = ?)
         OR (? IS NOT NULL AND phone = ?)
       )
     ORDER BY created_at DESC
     LIMIT 1`,
    [otpCode, purpose, email, email, phone, phone]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await pool.query(
    'UPDATE otp_verifications SET is_used = 1 WHERE id = ?',
    [id]
  );
}

module.exports = {
  create,
  invalidatePrevious,
  findValidOtp,
  markUsed,
};
