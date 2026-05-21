/**
 * Database migration runner.
 * Creates the database (if missing) and applies schema.sql.
 *
 * Usage: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

async function applyMigrations(connection) {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying migration: ${file}`);
    try {
      await connection.query(sql);
    } catch (err) {
      const skipCodes = new Set([
        'ER_DUP_FIELDNAME',
        'ER_TABLE_EXISTS_ERROR',
        'ER_DUP_KEYNAME',
      ]);
      if (skipCodes.has(err.code)) {
        console.log(`  (skipped — already applied: ${err.message})`);
        continue;
      }
      throw err;
    }
  }
}

async function migrate() {
  const { host, port, user, password, database } = config.db;

  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Database "${database}" ready.`);

    await connection.query(`USE \`${database}\``);

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log('Applying schema...');
    await connection.query(schema);
    await applyMigrations(connection);

    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Migration complete. Tables (${tables.length}):`);
    tables.forEach((row) => {
      console.log(`  - ${Object.values(row)[0]}`);
    });
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
