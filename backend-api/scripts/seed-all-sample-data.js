const db = require('../knexfile.js');
const { exec } = require('child_process');
const path = require('path');

/**
 * Script tổng hợp để chạy tất cả seed data
 * 
 * Chạy: node backend-api/scripts/seed-all-sample-data.js
 */

console.log('🌱 Starting to seed all sample data...\n');

const seeds = [
  {
    name: 'Vouchers',
    file: path.join(__dirname, '../seeds/sample-vouchers.js'),
    description: 'Creating sample vouchers'
  },
  {
    name: 'Orders with Vouchers',
    file: path.join(__dirname, '../seeds/sample-orders-with-vouchers.js'),
    description: 'Creating sample orders with vouchers for revenue testing'
  }
];

async function runSeeds() {
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    console.log(`\n[${i + 1}/${seeds.length}] ${seed.name}`);
    console.log(`   ${seed.description}`);
    console.log(`   Running: ${seed.file}\n`);

    await new Promise((resolve, reject) => {
      exec(`node "${seed.file}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error running ${seed.name}:`, error.message);
          if (stderr) console.error(stderr);
          reject(error);
          return;
        }
        
        if (stdout) {
          console.log(stdout);
        }
        
        resolve();
      });
    });

    // Đợi một chút giữa các seeds
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ All seeds completed successfully!\n');
  
  // Hiển thị tổng kết
  try {
    const voucherCount = await db('vouchers').count('id as count').first();
    const orderCount = await db('orders').count('id as count').first();
    const completedOrderCount = await db('orders').where('status', 'completed').count('id as count').first();
    const revenueResult = await db('orders')
      .where('status', 'completed')
      .select(db.raw('SUM(total_price - COALESCE(discount_amount, 0)) as total'))
      .first();

    console.log('📊 Database Summary:');
    console.log(`   - Total Vouchers: ${voucherCount?.count || 0}`);
    console.log(`   - Total Orders: ${orderCount?.count || 0}`);
    console.log(`   - Completed Orders: ${completedOrderCount?.count || 0}`);
    console.log(`   - Total Revenue: ${parseFloat(revenueResult?.total || 0).toLocaleString('vi-VN')} VNĐ`);
    console.log('\n✨ Ready for testing!\n');
  } catch (error) {
    console.error('⚠️  Could not fetch summary:', error.message);
  }

  process.exit(0);
}

runSeeds().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

