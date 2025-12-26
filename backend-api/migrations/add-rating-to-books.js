const db = require('../knexfile.js');

const addRatingToBooks = async () => {
  try {
    // Check if columns exist
    const columns = await db.raw(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'books' 
      AND COLUMN_NAME IN ('rating', 'ratingCount')
    `);
    
    const existingColumns = columns[0].map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('rating')) {
      await db.raw(`
        ALTER TABLE books 
        ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0
      `);
      console.log('✅ Column "rating" added to books table.');
    } else {
      console.log('✅ Column "rating" already exists in books table.');
    }
    
    if (!existingColumns.includes('ratingCount')) {
      await db.raw(`
        ALTER TABLE books 
        ADD COLUMN ratingCount INT DEFAULT 0
      `);
      console.log('✅ Column "ratingCount" added to books table.');
    } else {
      console.log('✅ Column "ratingCount" already exists in books table.');
    }
  } catch (error) {
    console.error('Error adding rating fields to books:', error);
    throw error;
  }
};

// Run migration
addRatingToBooks().then(() => {
  console.log('✅ Rating fields migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Rating fields migration failed:', error);
  process.exit(1);
});

