const db = require('../knexfile.js');

const createReviewsTable = async () => {
  try {
    // Check if table exists
    const hasTable = await db.schema.hasTable('reviews');
    
    if (!hasTable) {
      await db.schema.createTable('reviews', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.integer('book_id').notNullable();
        table.integer('order_id').nullable(); // Link to order
        table.integer('rating').notNullable(); // 1-5 stars
        table.text('comment').nullable();
        table.boolean('is_approved').defaultTo(true); // Admin can approve/reject
        table.timestamps(true, true);
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('book_id').references('id').inTable('books').onDelete('CASCADE');
        table.foreign('order_id').references('id').inTable('orders').onDelete('SET NULL');
        table.unique(['user_id', 'book_id', 'order_id']); // One review per order
      });
      console.log('✅ Table "reviews" created successfully!');
    } else {
      console.log('✅ Table "reviews" already exists!');
    }
  } catch (error) {
    console.error('Error creating reviews table:', error);
  }
};

// Run migration
createReviewsTable().then(() => {
  console.log('✅ Reviews migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Reviews migration failed:', error);
  process.exit(1);
});

