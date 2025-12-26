const db = require('../knexfile.js');

const sampleVouchers = [
  {
    code: 'WELCOME10',
    name: 'Mã giảm giá chào mừng',
    description: 'Giảm 10% cho đơn hàng đầu tiên, tối đa 50.000 VNĐ',
    type: 'percentage',
    value: 10,
    min_order_amount: 100000,
    max_discount: 50000,
    usage_limit: 100,
    user_limit: 1,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    is_active: true,
  },
  {
    code: 'SAVE50K',
    name: 'Tiết kiệm 50k',
    description: 'Giảm 50.000 VNĐ cho đơn hàng từ 500.000 VNĐ',
    type: 'fixed',
    value: 50000,
    min_order_amount: 500000,
    max_discount: null,
    usage_limit: 200,
    user_limit: 2,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    is_active: true,
  },
  {
    code: 'SUMMER20',
    name: 'Khuyến mãi mùa hè',
    description: 'Giảm 20% cho đơn hàng từ 1.000.000 VNĐ, tối đa 200.000 VNĐ',
    type: 'percentage',
    value: 20,
    min_order_amount: 1000000,
    max_discount: 200000,
    usage_limit: 50,
    user_limit: 1,
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    is_active: true,
  },
  {
    code: 'VIP30',
    name: 'Mã VIP',
    description: 'Giảm 30% cho đơn hàng từ 2.000.000 VNĐ, tối đa 500.000 VNĐ',
    type: 'percentage',
    value: 30,
    min_order_amount: 2000000,
    max_discount: 500000,
    usage_limit: 30,
    user_limit: 1,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    is_active: true,
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển',
    description: 'Giảm 30.000 VNĐ (phí ship) cho đơn hàng từ 300.000 VNĐ',
    type: 'fixed',
    value: 30000,
    min_order_amount: 300000,
    max_discount: null,
    usage_limit: null, // Unlimited
    user_limit: 5,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    is_active: true,
  },
  {
    code: 'NEWUSER',
    name: 'Ưu đãi người dùng mới',
    description: 'Giảm 15% cho người dùng mới, tối đa 100.000 VNĐ',
    type: 'percentage',
    value: 15,
    min_order_amount: 200000,
    max_discount: 100000,
    usage_limit: 500,
    user_limit: 1,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    is_active: true,
  },
];

async function seedVouchers() {
  try {
    console.log('🌱 Seeding vouchers...');
    
    // Check if vouchers table exists
    const hasTable = await db.schema.hasTable('vouchers');
    if (!hasTable) {
      console.log('❌ Vouchers table does not exist. Please run create-vouchers.js migration first.');
      process.exit(1);
    }

    // Clear existing sample vouchers (optional - comment out if you want to keep existing data)
    // await db('vouchers').whereIn('code', sampleVouchers.map(v => v.code)).del();
    // console.log('✅ Cleared existing sample vouchers');

    // Insert sample vouchers
    let inserted = 0;
    let skipped = 0;

    for (const voucher of sampleVouchers) {
      // Check if voucher code already exists
      const existing = await db('vouchers').where('code', voucher.code).first();
      
      if (existing) {
        console.log(`⏭️  Voucher ${voucher.code} already exists, skipping...`);
        skipped++;
      } else {
        await db('vouchers').insert(voucher);
        console.log(`✅ Inserted voucher: ${voucher.code} - ${voucher.name}`);
        inserted++;
      }
    }

    console.log(`\n✅ Vouchers seeding completed!`);
    console.log(`   - Inserted: ${inserted}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Total: ${sampleVouchers.length}`);
    
    // Display all vouchers
    const allVouchers = await db('vouchers').select('code', 'name', 'type', 'value', 'is_active');
    console.log('\n📋 Current vouchers in database:');
    allVouchers.forEach(v => {
      const value = v.type === 'percentage' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} VNĐ`;
      const status = v.is_active ? '✅ Active' : '❌ Inactive';
      console.log(`   - ${v.code}: ${v.name} (${value}) - ${status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding vouchers:', error);
    process.exit(1);
  }
}

// Run seeding
seedVouchers();

