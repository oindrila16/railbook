/**
 * Station data access layer.
 */
const pool = require('../config/database');

async function findByCode(code) {
  const [rows] = await pool.query(
    'SELECT * FROM stations WHERE UPPER(code) = UPPER(?) LIMIT 1',
    [code.trim()]
  );
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, name, code, city, state FROM stations ORDER BY city, name'
  );
  return rows;
}

module.exports = { findByCode, findAll };
