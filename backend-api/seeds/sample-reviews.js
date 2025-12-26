const db = require('../knexfile.js');

async function seedReviews() {
  try {
    console.log('🌱 Seeding sample reviews...');
    
    // Check if reviews table exists
    const hasTable = await db.schema.hasTable('reviews');
    if (!hasTable) {
      console.log('❌ Reviews table does not exist. Please run create-reviews.js migration first.');
      process.exit(1);
    }

    // Get some users and books
    const users = await db('users').select('id', 'username').limit(5);
    const books = await db('books').select('id', 'title').limit(10);

    if (users.length === 0) {
      console.log('⚠️  No users found. Please create users first.');
      process.exit(1);
    }

    if (books.length === 0) {
      console.log('⚠️  No books found. Please create books first.');
      process.exit(1);
    }

    // Get some orders
    const orders = await db('orders')
      .select('id', 'user_id', 'book_id')
      .limit(20);

    console.log(`📊 Found ${users.length} users, ${books.length} books, ${orders.length} orders`);

    // Sample reviews
    const sampleReviews = [];
    const comments = [
      'Sản phẩm rất tốt, đúng như mô tả!',
      'Giao hàng nhanh, đóng gói cẩn thận. Rất hài lòng!',
      'Chất lượng sản phẩm tốt, giá cả hợp lý.',
      'Sản phẩm đẹp, đúng với hình ảnh. Sẽ mua lại!',
      'Tuyệt vời! Đúng như mong đợi.',
      'Sản phẩm ổn, nhưng có thể cải thiện thêm.',
      'Rất hài lòng với chất lượng và dịch vụ.',
      'Sản phẩm tốt, giao hàng đúng hẹn.',
      'Đáng giá đồng tiền bỏ ra!',
      'Sản phẩm chất lượng cao, rất đáng mua.',
    ];

    // Create reviews from orders
    let reviewCount = 0;
    for (const order of orders) {
      try {
        const bookIds = JSON.parse(order.book_id || '[]');
        if (!Array.isArray(bookIds) || bookIds.length === 0) continue;

        // Create review for first book in order
        const bookId = bookIds[0];
        const book = books.find(b => b.id === bookId);
        if (!book) continue;

        // Check if review already exists
        const existing = await db('reviews')
          .where('user_id', order.user_id)
          .where('book_id', bookId)
          .where('order_id', order.id)
          .first();

        if (existing) {
          console.log(`⏭️  Review already exists for order ${order.id}, skipping...`);
          continue;
        }

        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        const comment = comments[Math.floor(Math.random() * comments.length)];

        await db('reviews').insert({
          user_id: order.user_id,
          book_id: bookId,
          order_id: order.id,
          rating,
          comment,
          is_approved: true,
        });

        reviewCount++;
        console.log(`✅ Created review for book ${book.title} by user ${order.user_id}`);
      } catch (error) {
        console.warn(`⚠️  Error creating review for order ${order.id}:`, error.message);
      }
    }

    // Create some additional random reviews
    for (let i = 0; i < 10; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const book = books[Math.floor(Math.random() * books.length)];

      // Check if review already exists
      const existing = await db('reviews')
        .where('user_id', user.id)
        .where('book_id', book.id)
        .first();

      if (existing) continue;

      const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
      const comment = comments[Math.floor(Math.random() * comments.length)];

      try {
        await db('reviews').insert({
          user_id: user.id,
          book_id: book.id,
          order_id: null,
          rating,
          comment,
          is_approved: true,
        });

        reviewCount++;
        console.log(`✅ Created random review for book ${book.title} by user ${user.username}`);
      } catch (error) {
        console.warn(`⚠️  Error creating random review:`, error.message);
      }
    }

    // Update book ratings
    console.log('\n📊 Updating book ratings...');
    for (const book of books) {
      const avgRating = await db('reviews')
        .where('book_id', book.id)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      const reviewCount = await db('reviews')
        .where('book_id', book.id)
        .where('is_approved', true)
        .count('id as count')
        .first();

      const avg = parseFloat(avgRating?.avg || 0);
      const count = parseInt(reviewCount?.count || 0);

      await db('books')
        .where('id', book.id)
        .update({
          rating: avg,
          ratingCount: count,
        });

      if (count > 0) {
        console.log(`   ✅ Updated ${book.title}: ${avg.toFixed(1)}⭐ (${count} reviews)`);
      }
    }

    console.log(`\n✅ Reviews seeding completed!`);
    console.log(`   - Created: ${reviewCount} reviews`);
    
    // Display statistics
    const totalReviews = await db('reviews').count('id as count').first();
    const avgRating = await db('reviews').where('is_approved', true).avg('rating as avg').first();
    
    console.log(`\n📈 Review Statistics:`);
    console.log(`   - Total reviews: ${totalReviews?.count || 0}`);
    console.log(`   - Average rating: ${parseFloat(avgRating?.avg || 0).toFixed(2)}⭐`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
}

// Run seeding
seedReviews();

