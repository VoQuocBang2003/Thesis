const db = require('../knexfile');

async function printTableSchema(tableName) {
  try {
    const rows = await db.raw(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    const cols = (rows && rows[0]) ? rows[0] : rows;
    if (!cols || cols.length === 0) {
      console.log(`No columns found for table: ${tableName} (table may not exist)`);
      return;
    }

    console.log(`\nSchema for table: ${tableName}`);
    for (const col of cols) {
      console.log(`- ${col.COLUMN_NAME} | ${col.COLUMN_TYPE} | nullable=${col.IS_NULLABLE} | default=${col.COLUMN_DEFAULT} | key=${col.COLUMN_KEY}`);
    }
  } catch (err) {
    console.error(`Error fetching schema for table ${tableName}:`, err.message || err);
  }
}

async function main() {
  const tables = ['books', 'orders', 'users'];
  for (const t of tables) {
    await printTableSchema(t);
  }
  process.exit(0);
}

main();
