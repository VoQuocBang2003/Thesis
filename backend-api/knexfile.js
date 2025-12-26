require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const knex = require('knex');

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_PASSWORD, DB_NAME
} = process.env;

const db = knex({
  client: 'mysql2',
  connection: {
    host: DB_HOST || '127.0.0.1',
    port: Number(DB_PORT || 3306),
    user: DB_USER || 'root',
    password: (DB_PASS ?? DB_PASSWORD ?? ''),
    database: DB_NAME,
  },
  pool: { min: 0, max: 7 },
});

module.exports = db;
