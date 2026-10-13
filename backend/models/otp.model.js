/**
 * OTP verification data access layer.
 */
const pool = require('../config/database');

async function create({ userId, email, phone, otpCode, purpose, expiresAt, pendingPasswordHash }) {
  const [result] = await pool.query(
    `INSERT INTO otp_verifications (user_id, email, phone, otp_code, purpose, expires_at, pending_password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, email || null, phone || null, otpCode, purpose, expiresAt, pendingPasswordHash || null]
  );
  return result.insertId;
}

/** Invalidate previous unused OTPs for the same contact + purpose */
async function invalidatePrevious({ email, phone, purpose }) {
  await pool.query(
    `UPDATE otp_verifications
     SET is_used = 1, pending_password_hash = NULL
     WHERE purpose = ?
       AND is_used = 0
       AND (
         (? IS NOT NULL AND email = ?)
         OR (? IS NOT NULL AND phone = ?)
       )`,
    [purpose, email, email, phone, phone]
  );
}

module.exports = { create, invalidatePrevious };

/** Lock the latest OTP, count guesses, and verify the account atomically. */
async function verifyRegistration({ email, phone, otpCode }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT * FROM otp_verifications
       WHERE purpose = 'registration' AND is_used = 0 AND expires_at > NOW()
         AND ((? IS NOT NULL AND email = ?) OR (? IS NOT NULL AND phone = ?))
       ORDER BY id DESC LIMIT 1 FOR UPDATE`, [email, email, phone, phone]
    );
    const record = rows[0];
    if (!record || record.attempts >= 5) {
      await connection.commit();
      return null;
    }
    if (record.otp_code !== otpCode) {
      await connection.query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [record.id]);
      await connection.commit();
      return null;
    }
    const [users] = await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [record.user_id]);
    const user = users[0];
    if (!user || !user.is_active) {
      await connection.commit();
      return null;
    }
    await connection.query('UPDATE otp_verifications SET is_used = 1, pending_password_hash = NULL WHERE id = ?', [record.id]);
    // A stale registration OTP must never reset an already verified user's password.
    if (!user.is_verified) {
      await connection.query(
        'UPDATE users SET is_verified = 1, password_hash = COALESCE(?, password_hash) WHERE id = ?',
        [record.pending_password_hash, user.id]
      );
    }
    await connection.commit();
    return user;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
module.exports.verifyRegistration = verifyRegistration;
