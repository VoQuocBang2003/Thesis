const db = require('../knexfile.js');

const createVouchersTable = async () => {
  try {
    // Check if table exists
    const hasTable = await db.schema.hasTable('vouchers');
    
    if (!hasTable) {
      await db.schema.createTable('vouchers', (table) => {
        table.increments('id').primary();
        table.string('code').notNullable().unique();
        table.string('name').notNullable();
        table.text('description');
        table.enum('type', ['percentage', 'fixed']).notNullable(); // percentage or fixed amount
        table.decimal('value', 10, 2).notNullable(); // percentage (0-100) or fixed amount
        table.decimal('min_order_amount', 10, 2).defaultTo(0); // Minimum order amount to use
        table.decimal('max_discount', 10, 2).nullable(); // Maximum discount for percentage type
        table.integer('usage_limit').nullable(); // Total usage limit
        table.integer('used_count').defaultTo(0); // Current usage count
        table.integer('user_limit').defaultTo(1); // Usage limit per user
        table.date('start_date').notNullable();
        table.date('end_date').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
      console.log('✅ Table "vouchers" created successfully!');
    } else {
      console.log('✅ Table "vouchers" already exists!');
    }

    // Create user_voucher_usage table to track usage per user
    const hasUsageTable = await db.schema.hasTable('user_voucher_usage');
    
    if (!hasUsageTable) {
      await db.schema.createTable('user_voucher_usage', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.integer('voucher_id').notNullable();
        table.integer('order_id').nullable();
        table.integer('usage_count').defaultTo(1);
        table.timestamp('used_at').defaultTo(db.fn.now());
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('voucher_id').references('id').inTable('vouchers').onDelete('CASCADE');
        table.foreign('order_id').references('id').inTable('orders').onDelete('SET NULL');
      });
      console.log('✅ Table "user_voucher_usage" created successfully!');
    } else {
      console.log('✅ Table "user_voucher_usage" already exists!');
    }
  } catch (error) {
    console.error('Error creating vouchers tables:', error);
  }
};

// Run migration
createVouchersTable().then(() => {
  console.log('✅ Vouchers migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Vouchers migration failed:', error);
  process.exit(1);
});


