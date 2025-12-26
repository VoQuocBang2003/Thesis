const db = require('../knexfile.js');

/**
 * Script để tạo dữ liệu mẫu orders với vouchers để test revenue management
 * 
 * Chạy script này bằng: node backend-api/seeds/sample-orders-with-vouchers.js
 */

async function seedSampleOrders() {
  try {
    console.log('🌱 Seeding sample orders with vouchers...\n');
    
    // Tùy chọn: Xóa orders mẫu cũ (uncomment nếu muốn tạo lại từ đầu)
    // const deleteOld = process.argv.includes('--fresh');
    // if (deleteOld) {
    //   console.log('🗑️  Deleting old sample orders...');
    //   await db('orders').where('shipping_address', 'like', '123 Đường ABC%').del();
    //   await db('vouchers').update({ used_count: 0 });
    //   await db('user_voucher_usage').del();
    //   console.log('✅ Old sample orders deleted.\n');
    // }

    // Kiểm tra các bảng cần thiết
    const hasOrdersTable = await db.schema.hasTable('orders');
    const hasVouchersTable = await db.schema.hasTable('vouchers');
    const hasUsersTable = await db.schema.hasTable('users');
    const hasBooksTable = await db.schema.hasTable('books');

    if (!hasOrdersTable) {
      console.log('❌ Orders table does not exist!');
      process.exit(1);
    }
    if (!hasVouchersTable) {
      console.log('❌ Vouchers table does not exist! Please run create-vouchers.js migration first.');
      process.exit(1);
    }
    if (!hasUsersTable || !hasBooksTable) {
      console.log('❌ Users or Books table does not exist!');
      process.exit(1);
    }

    // Lấy dữ liệu từ database
    const users = await db('users').select('id').limit(10);
    const books = await db('books').select('id', 'price').limit(20);
    const vouchers = await db('vouchers').select('id', 'code', 'type', 'value', 'min_order_amount', 'max_discount');

    if (users.length === 0) {
      console.log('⚠️  No users found. Please create users first.');
      process.exit(1);
    }
    if (books.length === 0) {
      console.log('⚠️  No books found. Please create books first.');
      process.exit(1);
    }
    if (vouchers.length === 0) {
      console.log('⚠️  No vouchers found. Please run sample-vouchers.js seed first.');
      process.exit(1);
    }

    console.log(`📊 Found ${users.length} users, ${books.length} books, ${vouchers.length} vouchers\n`);

    // Kiểm tra các cột trong orders table
    const orderColumns = await db.raw(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders'
    `);
    const columnNames = orderColumns[0].map(col => col.COLUMN_NAME);
    const hasStatus = columnNames.includes('status');
    const hasOrderDate = columnNames.includes('order_date');

    if (!hasStatus) {
      console.log('⚠️  Warning: orders table does not have "status" column. Will use default.');
    }
    if (!hasOrderDate) {
      console.log('⚠️  Warning: orders table does not have "order_date" column. Will use created_at.');
    }

    // Tạo hàm helper để tính discount
    function calculateDiscount(voucher, orderAmount) {
      if (!voucher) return { discount: 0, finalAmount: orderAmount };
      
      let discount = 0;
      if (voucher.type === 'percentage') {
        discount = (orderAmount * voucher.value) / 100;
        if (voucher.max_discount && discount > voucher.max_discount) {
          discount = voucher.max_discount;
        }
      } else {
        discount = voucher.value;
      }
      
      const finalAmount = Math.max(0, orderAmount - discount);
      return { discount, finalAmount };
    }

    // Tạo hàm helper để tạo ngày ngẫu nhiên trong khoảng thời gian
    function randomDate(start, end) {
      const startTime = start.getTime();
      const endTime = end.getTime();
      const randomTime = startTime + Math.random() * (endTime - startTime);
      return new Date(randomTime);
    }

    // Tạo orders mẫu
    const sampleOrders = [];
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const paymentMethods = ['cod', 'bank_transfer', 'credit_card'];
    
    // Tạo orders trong 3 tháng gần đây
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    console.log('📦 Creating sample orders...\n');

    // Tạo 50 orders mẫu
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const bookCount = Math.floor(Math.random() * 3) + 1; // 1-3 books per order
      const selectedBooks = [];
      
      // Chọn ngẫu nhiên books
      for (let j = 0; j < bookCount; j++) {
        const book = books[Math.floor(Math.random() * books.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        selectedBooks.push({ book_id: book.id, quantity });
      }

      // Tính tổng giá trị đơn hàng
      let totalPrice = 0;
      selectedBooks.forEach(item => {
        const book = books.find(b => b.id === item.book_id);
        totalPrice += (book.price * item.quantity);
      });

      // 60% orders có voucher, 40% không có
      let voucher = null;
      let voucherId = null;
      let voucherCode = null;
      let discountAmount = 0;
      let finalPrice = totalPrice;

      if (Math.random() < 0.6 && totalPrice >= 100000) {
        // Chọn voucher phù hợp với giá trị đơn hàng
        const applicableVouchers = vouchers.filter(v => {
          if (v.min_order_amount && totalPrice < v.min_order_amount) {
            return false;
          }
          return true;
        });

        if (applicableVouchers.length > 0) {
          voucher = applicableVouchers[Math.floor(Math.random() * applicableVouchers.length)];
          voucherId = voucher.id;
          voucherCode = voucher.code;
          
          const discountCalc = calculateDiscount(voucher, totalPrice);
          discountAmount = discountCalc.discount;
          finalPrice = discountCalc.finalAmount;
        }
      }

      // Chọn status - ưu tiên completed cho orders có voucher để test revenue
      let status;
      if (voucher && Math.random() < 0.7) {
        status = 'completed'; // 70% orders có voucher là completed
      } else {
        status = statuses[Math.floor(Math.random() * statuses.length)];
      }

      // Tạo ngày ngẫu nhiên trong 3 tháng gần đây
      const orderDate = randomDate(threeMonthsAgo, now);

      // Format date for MySQL
      const orderDateStr = orderDate.toISOString().slice(0, 19).replace('T', ' ');

      const order = {
        book_id: JSON.stringify(selectedBooks),
        total_price: finalPrice,
        quantity: selectedBooks.reduce((sum, item) => sum + item.quantity, 0),
        user_id: user.id,
        shipping_address: `123 Đường ABC, Quận ${Math.floor(Math.random() * 12) + 1}, TP.HCM`,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        voucher_id: voucherId,
        discount_amount: discountAmount,
        voucher_code: voucherCode,
        created_at: orderDateStr,
        updated_at: orderDateStr,
      };

      // Chỉ thêm status và order_date nếu cột tồn tại
      if (hasStatus) {
        order.status = status;
      }
      if (hasOrderDate) {
        order.order_date = orderDateStr;
      }

      sampleOrders.push(order);
    }

    // Insert orders vào database
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < sampleOrders.length; i++) {
      const order = sampleOrders[i];
      try {
        // Insert order và lấy ID
        const [orderId] = await db('orders').insert(order);
        inserted++;
        
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`   Inserted ${i + 1}/${sampleOrders.length} orders...\r`);
        }
        
        // Update voucher used_count nếu có voucher
        if (order.voucher_id) {
          await db('vouchers')
            .where('id', order.voucher_id)
            .increment('used_count', 1);
        }

        // Tạo user_voucher_usage record nếu có voucher
        if (order.voucher_id && order.user_id) {
          try {
            await db('user_voucher_usage').insert({
              user_id: order.user_id,
              voucher_id: order.voucher_id,
              order_id: orderId,
              usage_count: 1,
              used_at: order.order_date,
            });
          } catch (usageError) {
            // Ignore duplicate key errors
            if (!usageError.message.includes('Duplicate')) {
              console.warn(`⚠️  Could not create user_voucher_usage:`, usageError.message);
            }
          }
        }
      } catch (error) {
        // Hiển thị lỗi chi tiết để debug
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) {
          skipped++;
        } else {
          // Chỉ hiển thị 5 lỗi đầu tiên để không spam console
          if (skipped < 5) {
            console.error(`\n⚠️  Error inserting order ${i + 1}:`, error.message);
            if (error.sql) {
              console.error(`   SQL:`, error.sql.substring(0, 200));
            }
          }
          skipped++;
        }
      }
    }
    
    if (inserted > 0) {
      console.log(`\n   ✅ Inserted ${inserted} orders successfully!`);
    }

    console.log(`\n✅ Sample orders seeding completed!`);
    console.log(`   - Inserted: ${inserted}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Total: ${sampleOrders.length}\n`);

    // Thống kê
    const ordersWithVoucher = sampleOrders.filter(o => o.voucher_id).length;
    const completedOrders = sampleOrders.filter(o => o.status === 'completed').length;
    const totalRevenue = sampleOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.total_price), 0);
    const totalDiscount = sampleOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.discount_amount), 0);

    console.log('📊 Statistics:');
    console.log(`   - Orders with voucher: ${ordersWithVoucher} (${(ordersWithVoucher/sampleOrders.length*100).toFixed(1)}%)`);
    console.log(`   - Completed orders: ${completedOrders}`);
    console.log(`   - Total revenue (completed): ${totalRevenue.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   - Total discount (completed): ${totalDiscount.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   - Net revenue: ${(totalRevenue - totalDiscount).toLocaleString('vi-VN')} VNĐ\n`);

    // Hiển thị voucher usage
    const voucherUsage = await db('vouchers')
      .select('code', 'name', 'used_count')
      .orderBy('used_count', 'desc')
      .limit(10);

    console.log('🎫 Top 10 Vouchers by Usage:');
    voucherUsage.forEach(v => {
      console.log(`   - ${v.code}: ${v.name} (${v.used_count} uses)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sample orders:', error);
    process.exit(1);
  }
}

// Chạy seeding
seedSampleOrders();

