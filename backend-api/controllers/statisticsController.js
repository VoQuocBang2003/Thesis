const db = require('../knexfile.js');
const { createResponse } = require('../jsend.js');

// Helper function to calculate revenue (Doanh thu): Tổng số tiền đã thu được = total_price - discount_amount
const calculateOrdersRevenue = (orders) => {
  return orders.map(order => {
    const totalPrice = parseFloat(order.total_price || 0);
    const discount = parseFloat(order.discount_amount || 0);
    return totalPrice - discount;
  });
};

// Helper function to calculate profit (Lợi nhuận): (Giá bán - Giá nhập) * Số lượng - Voucher
// Optimized to batch process multiple orders
const calculateOrdersProfit = async (orders, bookMap = null) => {
  try {
    // Collect all unique book IDs from all orders
    const allBookIds = new Set();
    orders.forEach(order => {
      try {
        const books = JSON.parse(order.book_id || '[]');
        if (Array.isArray(books)) {
          books.forEach(book => {
            let bookId;
            if (typeof book === 'object' && book.book_id) bookId = book.book_id;
            else if (typeof book === 'object' && book.id) bookId = book.id;
            else bookId = book;
            if (bookId) allBookIds.add(bookId);
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    // Get price and cost_price for all books if not provided
    if (!bookMap) {
      const bookIdsArray = Array.from(allBookIds);
      if (bookIdsArray.length > 0) {
        const bookDetails = await db('books')
          .whereIn('id', bookIdsArray)
          .select('id', 'price', 'cost_price');

        bookMap = {};
        bookDetails.forEach(book => {
          bookMap[book.id] = {
            price: parseFloat(book.price || 0),
            cost_price: parseFloat(book.cost_price || 0)
          };
        });
      } else {
        bookMap = {};
      }
    }

    // Calculate revenue for each order
    const revenues = [];
    orders.forEach(order => {
      try {
        const books = JSON.parse(order.book_id || '[]');
        if (!Array.isArray(books) || books.length === 0) {
          revenues.push(0);
          return;
        }

        let totalRevenue = 0;
        books.forEach(book => {
          let bookId, quantity;
          
          if (typeof book === 'object' && book.book_id && book.quantity) {
            bookId = book.book_id;
            quantity = book.quantity;
          } else if (typeof book === 'object' && book.id && book.quantity) {
            bookId = book.id;
            quantity = book.quantity;
          } else {
            bookId = book;
            quantity = 1;
          }

          const bookInfo = bookMap[bookId];
          if (bookInfo) {
            const profitPerUnit = bookInfo.price - bookInfo.cost_price;
            totalRevenue += profitPerUnit * quantity;
          }
        });

        // Subtract voucher discount
        const discount = parseFloat(order.discount_amount || 0);
        revenues.push(Math.max(0, totalRevenue - discount));
      } catch (error) {
        console.error('Error calculating order revenue:', error);
        // Fallback to old calculation
        revenues.push(parseFloat(order.total_price || 0) - parseFloat(order.discount_amount || 0));
      }
    });

    return revenues;
  } catch (error) {
    console.error('Error in calculateOrdersProfit:', error);
    // Fallback: return 0 for all orders
    return orders.map(() => 0);
  }
};

const statisticsController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
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
      const hasDiscountAmount = columnNames.includes('discount_amount');

      // Total users
      const totalUsers = await db('users').count('id as count').first();
      
      // Total products
      const totalProducts = await db('books').count('id as count').first();
      
      // Total orders
      const totalOrders = await db('orders').count('id as count').first();
      
      // Total revenue - Tính theo công thức mới: Doanh thu = (Giá bán - Giá nhập) * Số lượng - Voucher
      let revenueResult = { total: 0 };
      try {
        // Lấy tất cả orders
        const allOrders = await db('orders')
          .select('id', 'book_id', 'discount_amount')
          .whereNotNull('book_id');
        
        console.log('📊 Total orders found:', allOrders.length);
        
        if (allOrders.length > 0) {
          // Tính tổng doanh thu theo công thức mới (batch process)
          const revenues = await calculateOrdersRevenue(allOrders);
          const total = revenues.reduce((sum, rev) => sum + rev, 0);
          revenueResult = { total: total };
          console.log('💰 Calculated total revenue (new formula):', total);
        }
      } catch (revenueErr) {
        console.error('❌ Revenue calculation error:', revenueErr.message);
        console.error('Error stack:', revenueErr.stack);
        // Fallback: lấy tất cả và tính thủ công
        try {
          const orders = await db('orders').select('total_price', 'discount_amount');
          let total = 0;
          orders.forEach(order => {
            total += (parseFloat(order.total_price || 0) - parseFloat(order.discount_amount || 0));
          });
          revenueResult = { total: total };
        } catch (fallbackErr) {
          console.error('Fallback revenue calculation also failed:', fallbackErr.message);
        }
      }
      
      // Orders by status
      let ordersByStatus = [];
      if (hasStatus) {
        try {
          ordersByStatus = await db('orders')
            .select('status')
            .count('id as count')
            .groupBy('status');
        } catch (err) {
          console.warn('Orders by status error:', err.message);
        }
      }
      
      // Recent orders (last 7 days)
      let recentOrders = { count: 0 };
      if (hasOrderDate) {
        try {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          recentOrders = await db('orders')
            .where('order_date', '>=', sevenDaysAgo)
            .count('id as count')
            .first();
        } catch (err) {
          console.warn('Recent orders error:', err.message);
        }
      }
      
      // Top selling products
      let topProducts = [];
      let productDetails = [];
      try {
        topProducts = await db('orders')
          .select('book_id')
          .count('id as order_count')
          .groupBy('book_id')
          .orderBy('order_count', 'desc')
          .limit(10);
        
        // Get product details for top products
        const topProductIds = topProducts.map(p => {
          try {
            const bookIds = JSON.parse(p.book_id || '[]');
            return Array.isArray(bookIds) ? bookIds.map(b => typeof b === 'object' ? b.book_id || b.id : b) : [bookIds];
          } catch {
            return [];
          }
        }).flat().filter(id => id);
        
        if (topProductIds.length > 0) {
          productDetails = await db('books')
            .whereIn('id', topProductIds)
            .select('id', 'title', 'price', 'image');
        }
      } catch (err) {
        console.warn('Top products error:', err.message);
      }
      
      // Revenue by month (last 6 months) - Lấy TẤT CẢ orders
      let revenueByMonth = [];
      try {
        // Xác định cột ngày để sử dụng
        let dateColumn = hasOrderDate ? 'order_date' : 'created_at';
        
        // Lấy TẤT CẢ orders trước (không filter status hay date)
        const allOrders = await db('orders')
          .select('id', 'book_id', 'discount_amount', dateColumn)
          .whereNotNull('book_id')
          .whereNotNull(dateColumn);
        
        console.log('📅 Orders for revenue by month:', allOrders.length);
        
        if (allOrders.length > 0) {
          // Tính doanh thu theo công thức mới (batch process)
          const revenues = await calculateOrdersRevenue(allOrders);
          
          // Tính doanh thu theo tháng
          const revenueMap = {};
          
          allOrders.forEach((order, index) => {
            const orderDate = new Date(order[dateColumn]);
            const month = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            const revenue = revenues[index] || 0;
            
            if (!revenueMap[month]) {
              revenueMap[month] = 0;
            }
            revenueMap[month] += revenue;
          });
          
          // Chuyển thành array và filter 6 tháng gần nhất
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          revenueByMonth = Object.keys(revenueMap)
            .map(month => {
              const [year, monthNum] = month.split('-');
              const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
              return {
                month: month,
                revenue: revenueMap[month],
                date: monthDate
              };
            })
            .filter(item => item.date >= sixMonthsAgo)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(item => ({
              month: item.month,
              revenue: item.revenue
            }));
          
          console.log('📊 Revenue by month calculated:', revenueByMonth.length, 'months');
        } else {
          // Fallback: thử query SQL
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          if (hasDiscountAmount) {
            revenueByMonth = await db('orders')
              .where(dateColumn, '>=', sixMonthsAgo)
              .select(
                db.raw(`DATE_FORMAT(${dateColumn}, "%Y-%m") as month`),
                db.raw('SUM(COALESCE(total_price, 0) - COALESCE(discount_amount, 0)) as revenue')
              )
              .groupBy('month')
              .orderBy('month', 'asc');
          } else {
            revenueByMonth = await db('orders')
              .where(dateColumn, '>=', sixMonthsAgo)
              .select(
                db.raw(`DATE_FORMAT(${dateColumn}, "%Y-%m") as month`),
                db.raw('SUM(COALESCE(total_price, 0)) as revenue')
              )
              .groupBy('month')
              .orderBy('month', 'asc');
          }
        }
      } catch (err) {
        console.error('❌ Revenue by month error:', err.message);
        console.error('Error stack:', err.stack);
      }
      
      // Categories distribution
      let categoriesDistribution = [];
      try {
        categoriesDistribution = await db('books')
          .join('categories', 'books.categories_id', 'categories.id')
          .select('categories.name', db.raw('COUNT(books.id) as count'))
          .groupBy('categories.id', 'categories.name')
          .orderBy('count', 'desc');
      } catch (err) {
        console.warn('Categories distribution error:', err.message);
      }
      
      res.status(200).json(createResponse(true, {
        totalUsers: parseInt(totalUsers?.count || 0),
        totalProducts: parseInt(totalProducts?.count || 0),
        totalOrders: parseInt(totalOrders?.count || 0),
        totalRevenue: parseFloat(revenueResult?.total || 0),
        ordersByStatus: ordersByStatus.map(o => ({
          status: o.status || 'unknown',
          count: parseInt(o.count || 0)
        })),
        recentOrders: parseInt(recentOrders?.count || 0),
        topProducts: productDetails.slice(0, 10),
        revenueByMonth: revenueByMonth.map(r => ({
          month: r.month,
          revenue: parseFloat(r.revenue || 0)
        })),
        categoriesDistribution: categoriesDistribution.map(c => ({
          name: c.name,
          count: parseInt(c.count || 0)
        }))
      }, 'Statistics retrieved successfully'));
    } catch (err) {
      console.error('❌ Error retrieving statistics:', err);
      console.error('Stack:', err.stack);
      res.status(500).json(createResponse(false, null, `Error retrieving statistics: ${err.message}`));
    }
  },

  // Get revenue by date range - Lọc theo order_date của bảng orders
  getRevenueByDateRange: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      console.log('📅 Revenue by date range request:', { startDate, endDate });
      
      // Kiểm tra cột order_date có tồn tại không
      const orderColumns = await db.raw(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'order_date'
      `);
      const hasOrderDate = orderColumns[0] && orderColumns[0].length > 0;
      const hasDiscountAmount = await db.raw(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'discount_amount'
      `).then(result => result[0] && result[0].length > 0);
      
      if (!hasOrderDate) {
        return res.status(400).json(createResponse(false, null, 'Bảng orders không có cột order_date'));
      }
      
      // Xây dựng query - LUÔN sử dụng order_date
      let query = db('orders');
      
      // Kiểm tra dữ liệu orders trước khi filter
      const allOrdersCheck = await db('orders')
        .select('id', 'order_date', 'total_price')
        .whereNotNull('order_date')
        .limit(10);
      console.log('📋 Sample orders (first 10):', allOrdersCheck.map(o => ({
        id: o.id,
        order_date: o.order_date,
        order_date_type: typeof o.order_date,
        order_date_string: String(o.order_date),
        total_price: o.total_price
      })));
      
      // Lấy min và max order_date để biết khoảng dữ liệu
      const dateRange = await db('orders')
        .whereNotNull('order_date')
        .select(
          db.raw('MIN(order_date) as min_date'),
          db.raw('MAX(order_date) as max_date'),
          db.raw('COUNT(*) as total_count')
        )
        .first();
      console.log('📅 Order date range in database:', dateRange);
      
      // Filter theo order_date nếu có - ĐỌC STRING VÀ DÙNG TRỰC TIẾP
      if (startDate && endDate) {
        // Đọc string từ frontend (format: YYYY-MM-DD)
        let start = String(startDate).trim();
        let end = String(endDate).trim();
        
        // Validate format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start) || !dateRegex.test(end)) {
          return res.status(400).json({ 
            error: 'Invalid date format. Expected YYYY-MM-DD',
            received: { startDate, endDate }
          });
        }
        
        console.log('📅 Backend - Received strings:', { start, end });
        console.log('📅 Backend - Date types:', { 
          startType: typeof start, 
          endType: typeof end,
          startLength: start.length,
          endLength: end.length
        });
        
        // Query: So sánh DATE(order_date) với string YYYY-MM-DD
        // Dùng DATE() function để chỉ so sánh phần date, bỏ qua time
        query = query.whereRaw('DATE(order_date) >= ?', [start])
                     .whereRaw('DATE(order_date) <= ?', [end]);
        
        // Verify query - đếm số orders trong khoảng
        const testCount = await db('orders')
          .whereRaw('DATE(order_date) >= ?', [start])
          .whereRaw('DATE(order_date) <= ?', [end])
          .whereNotNull('order_date')
          .count('id as count')
          .first();
        console.log('🔍 Orders count in range:', testCount?.count || 0);
        
        // Lấy mẫu để verify
        const sampleOrders = await db('orders')
          .whereRaw('DATE(order_date) >= ?', [start])
          .whereRaw('DATE(order_date) <= ?', [end])
          .whereNotNull('order_date')
          .select('id', 'order_date', 'total_price')
          .orderBy('order_date', 'asc')
          .limit(5);
        console.log('🔍 Sample orders:', sampleOrders.map(o => ({
          id: o.id,
          order_date: o.order_date,
          date_str: o.order_date ? String(o.order_date).substring(0, 10) : null
        })));
      } else {
        console.log('⚠️ No date range provided, getting all orders');
      }
      
      // Lấy TẤT CẢ orders (không filter status)
      const orders = await query
        .select(
          'id',
          'order_date',
          'book_id',
          'total_price',
          hasDiscountAmount ? 'discount_amount' : db.raw('0 as discount_amount'),
          'voucher_code',
          'user_id'
        )
        .whereNotNull('order_date')
        .whereNotNull('book_id')
        .orderBy('order_date', 'desc');

      console.log('📊 Orders found:', orders.length);
      if (orders.length > 0) {
        console.log('📅 First order date:', orders[0].order_date);
        console.log('📅 Last order date:', orders[orders.length - 1].order_date);
      }

      // Tính doanh thu theo công thức mới
      const revenues = await calculateOrdersRevenue(orders);
      const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);

      const totalDiscount = orders.reduce((sum, order) => {
        return sum + parseFloat(order.discount_amount || 0);
      }, 0);

      const totalOrders = orders.length;

      console.log('💰 Summary:', { totalRevenue, totalDiscount, totalOrders });

      res.status(200).json(createResponse(true, {
        orders,
        summary: {
          totalRevenue: totalRevenue,
          totalDiscount: totalDiscount,
          totalOrders: totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        }
      }, 'Revenue data retrieved successfully'));
    } catch (err) {
      console.error('❌ Error retrieving revenue data:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json(createResponse(false, null, 'Error retrieving revenue data: ' + err.message));
    }
  },

  // Get revenue by product
  getRevenueByProduct: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
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
      const hasDiscountAmount = columnNames.includes('discount_amount');
      
      let query = db('orders')
        .select('book_id', 'total_price', hasDiscountAmount ? 'discount_amount' : db.raw('0 as discount_amount'), hasOrderDate ? 'order_date' : 'created_at as order_date');

      // Không filter theo status - lấy TẤT CẢ orders
      
      if (startDate && endDate && hasOrderDate) {
        query = query.whereRaw('DATE(order_date) >= ?', [startDate])
                     .whereRaw('DATE(order_date) <= ?', [endDate]);
      } else if (startDate && endDate) {
        // Nếu không có order_date, dùng created_at
        query = query.whereRaw('DATE(created_at) >= ?', [startDate])
                     .whereRaw('DATE(created_at) <= ?', [endDate]);
      }

      const orders = await query.whereNotNull('book_id');

      // Get all book details first for cost_price
      const allBookIds = new Set();
      orders.forEach(order => {
        try {
          const books = JSON.parse(order.book_id || '[]');
          if (Array.isArray(books)) {
            books.forEach(book => {
              let bookId;
              if (typeof book === 'object' && book.book_id) bookId = book.book_id;
              else if (typeof book === 'object' && book.id) bookId = book.id;
              else bookId = book;
              if (bookId) allBookIds.add(bookId);
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      const bookDetails = await db('books')
        .whereIn('id', Array.from(allBookIds))
        .select('id', 'title', 'price', 'cost_price', 'image');

      const bookMap = {};
      bookDetails.forEach(book => {
        bookMap[book.id] = {
          price: parseFloat(book.price || 0),
          cost_price: parseFloat(book.cost_price || 0)
        };
      });

      // Process orders to extract product revenue and profit
      const productData = {};
      
      orders.forEach(order => {
        try {
          const books = JSON.parse(order.book_id || '[]');
          const discount = parseFloat(order.discount_amount || 0);
          const totalPrice = parseFloat(order.total_price || 0);
          const orderRevenue = totalPrice - discount; // Doanh thu = Đơn giá - voucher
          
          if (Array.isArray(books)) {
            // Calculate total profit for this order
            let totalOrderProfit = 0;
            const bookCounts = {};
            
            books.forEach(book => {
              let bookId, quantity;
              
              if (typeof book === 'object' && book.book_id && book.quantity) {
                bookId = book.book_id;
                quantity = book.quantity;
              } else if (typeof book === 'object' && book.id && book.quantity) {
                bookId = book.id;
                quantity = book.quantity;
              } else {
                bookId = book;
                quantity = 1;
              }

              const bookInfo = bookMap[bookId];
              if (bookInfo) {
                const profitPerUnit = bookInfo.price - bookInfo.cost_price;
                const profitForThisBook = profitPerUnit * quantity;
                totalOrderProfit += profitForThisBook;
                
                if (!bookCounts[bookId]) {
                  bookCounts[bookId] = { quantity: 0, profit: 0, revenue: 0 };
                }
                bookCounts[bookId].quantity += quantity;
                bookCounts[bookId].profit += profitForThisBook;
                // Distribute revenue proportionally by price
                const bookPrice = bookInfo.price * quantity;
                bookCounts[bookId].revenue += bookPrice;
              }
            });

            // Calculate order profit = total profit - discount
            const orderProfit = Math.max(0, totalOrderProfit - discount);
            
            // Calculate total price of all books in order for revenue distribution
            const totalBookPrice = Object.values(bookCounts).reduce((sum, data) => sum + data.revenue, 0);
            
            Object.keys(bookCounts).forEach(bookId => {
              const bookData = bookCounts[bookId];
              
              // Distribute revenue proportionally based on price
              const revenueShare = totalBookPrice > 0 
                ? (bookData.revenue / totalBookPrice) * orderRevenue 
                : 0;
              
              // Distribute profit proportionally based on profit
              const profitShare = totalOrderProfit > 0 
                ? (bookData.profit / totalOrderProfit) * orderProfit 
                : 0;

              if (!productData[bookId]) {
                productData[bookId] = {
                  bookId,
                  totalRevenue: 0,
                  totalProfit: 0,
                  totalQuantity: 0,
                  orderCount: 0
                };
              }

              productData[bookId].totalRevenue += revenueShare;
              productData[bookId].totalProfit += profitShare;
              productData[bookId].totalQuantity += bookData.quantity;
              productData[bookId].orderCount += 1;
            });
          }
        } catch (e) {
          console.error('Error parsing book_id:', e);
        }
      });

      // Get book details for response
      const bookIds = Object.keys(productData);
      const books = bookDetails.filter(book => bookIds.includes(String(book.id)));

      const result = books.map(book => ({
        ...book,
        revenue: productData[book.id]?.totalRevenue || 0,
        profit: productData[book.id]?.totalProfit || 0,
        quantitySold: productData[book.id]?.totalQuantity || 0,
        orderCount: productData[book.id]?.orderCount || 0
      })).sort((a, b) => b.revenue - a.revenue);

      res.status(200).json(createResponse(true, result, 'Product revenue retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving product revenue'));
    }
  },

  // Get revenue report (detailed)
  getRevenueReport: async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json(createResponse(false, null, 'Start date and end date are required'));
      }

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
      const hasDiscountAmount = columnNames.includes('discount_amount');
      const hasVoucherId = columnNames.includes('voucher_id');
      
      // Xác định cột ngày để sử dụng
      const dateColumn = hasOrderDate ? 'order_date' : 'created_at';

      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'year':
          dateFormat = '%Y';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      // Không filter theo status - lấy TẤT CẢ orders
      const orders = await db('orders')
        .whereRaw(`DATE(${dateColumn}) >= ?`, [startDate])
        .whereRaw(`DATE(${dateColumn}) <= ?`, [endDate])
        .whereNotNull('book_id')
        .select('id', 'book_id', 'total_price', 'discount_amount', dateColumn);

      // Calculate revenue (Doanh thu) = total_price - discount_amount
      const revenues = calculateOrdersRevenue(orders);
      
      // Calculate profit (Lợi nhuận) = (Giá bán - Giá nhập) * Số lượng - Voucher
      const profits = await calculateOrdersProfit(orders);

      // Group by period
      const revenueMap = {};
      orders.forEach((order, index) => {
        const orderDate = new Date(order[dateColumn]);
        let period;
        switch (groupBy) {
          case 'day':
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
            break;
          case 'week':
            const week = Math.ceil((orderDate.getDate() + new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7);
            period = `${orderDate.getFullYear()}-${String(week).padStart(2, '0')}`;
            break;
          case 'month':
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            period = `${orderDate.getFullYear()}`;
            break;
          default:
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
        }

        if (!revenueMap[period]) {
          revenueMap[period] = {
            revenue: 0,
            profit: 0,
            total_discount: 0,
            order_count: 0
          };
        }
        revenueMap[period].revenue += revenues[index] || 0;
        revenueMap[period].profit += profits[index] || 0;
        revenueMap[period].total_discount += parseFloat(order.discount_amount || 0);
        revenueMap[period].order_count += 1;
      });

      const revenueData = Object.keys(revenueMap)
        .map(period => ({
          period,
          revenue: revenueMap[period].revenue,
          profit: revenueMap[period].profit,
          total_discount: revenueMap[period].total_discount,
          order_count: revenueMap[period].order_count
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      // Voucher usage statistics
      let voucherUsage = [];
      if (hasVoucherId) {
        try {
          voucherUsage = await db('orders')
            .whereRaw(`DATE(${dateColumn}) >= ?`, [startDate])
            .whereRaw(`DATE(${dateColumn}) <= ?`, [endDate])
            .whereNotNull('voucher_id')
            .whereNotNull('total_price')
            .select('voucher_code', 'voucher_id')
            .count('id as usage_count')
            .sum(hasDiscountAmount ? 'discount_amount as total_discount' : db.raw('0 as total_discount'))
            .groupBy('voucher_code', 'voucher_id');
        } catch (err) {
          console.warn('Voucher usage error:', err.message);
        }
      }

      const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
      const totalProfit = revenueData.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
      const totalDiscount = revenueData.reduce((sum, item) => sum + parseFloat(item.total_discount || 0), 0);
      const totalOrders = revenueData.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0);

      res.status(200).json(createResponse(true, {
        revenueByPeriod: revenueData.map(item => ({
          period: item.period,
          revenue: parseFloat(item.revenue || 0),
          profit: parseFloat(item.profit || 0),
          discount: parseFloat(item.total_discount || 0),
          orderCount: parseInt(item.order_count || 0)
        })),
        voucherUsage: voucherUsage.map(item => ({
          voucherCode: item.voucher_code,
          voucherId: item.voucher_id,
          usageCount: parseInt(item.usage_count || 0),
          totalDiscount: parseFloat(item.total_discount || 0)
        })),
        summary: {
          totalRevenue,
          totalProfit,
          totalDiscount,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          averageProfitPerOrder: totalOrders > 0 ? totalProfit / totalOrders : 0,
          discountRate: totalRevenue > 0 ? (totalDiscount / (totalRevenue + totalDiscount)) * 100 : 0,
          profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
        }
      }, 'Revenue report retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving revenue report'));
    }
  },

  // Compare revenue with previous period
  compareRevenue: async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json(createResponse(false, null, 'Start date and end date are required'));
      }

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
      const hasDiscountAmount = columnNames.includes('discount_amount');
      
      // Xác định cột ngày để sử dụng
      const dateColumn = hasOrderDate ? 'order_date' : 'created_at';

      // Calculate previous period dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - periodDays + 1);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'year':
          dateFormat = '%Y';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      // Current period - Không filter theo status, lấy TẤT CẢ orders
      const currentOrders = await db('orders')
        .whereRaw(`DATE(${dateColumn}) >= ?`, [startDate])
        .whereRaw(`DATE(${dateColumn}) <= ?`, [endDate])
        .whereNotNull('book_id')
        .whereNotNull(dateColumn)
        .select('id', 'book_id', 'total_price', 'discount_amount', dateColumn);

      // Calculate revenue (Doanh thu) = total_price - discount_amount
      const currentRevenues = calculateOrdersRevenue(currentOrders);
      
      // Calculate profit (Lợi nhuận) = (Giá bán - Giá nhập) * Số lượng - Voucher
      const currentProfits = await calculateOrdersProfit(currentOrders);

      // Group by period
      const currentMap = {};
      currentOrders.forEach((order, index) => {
        const orderDate = new Date(order[dateColumn]);
        let period;
        switch (groupBy) {
          case 'day':
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
            break;
          case 'week':
            const week = Math.ceil((orderDate.getDate() + new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7);
            period = `${orderDate.getFullYear()}-${String(week).padStart(2, '0')}`;
            break;
          case 'month':
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            period = `${orderDate.getFullYear()}`;
            break;
          default:
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
        }

        if (!currentMap[period]) {
          currentMap[period] = { revenue: 0, profit: 0, total_discount: 0, order_count: 0 };
        }
        currentMap[period].revenue += currentRevenues[index] || 0;
        currentMap[period].profit += currentProfits[index] || 0;
        currentMap[period].total_discount += parseFloat(order.discount_amount || 0);
        currentMap[period].order_count += 1;
      });

      const currentData = Object.keys(currentMap)
        .map(period => ({
          period,
          revenue: currentMap[period].revenue,
          profit: currentMap[period].profit,
          total_discount: currentMap[period].total_discount,
          order_count: currentMap[period].order_count
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      // Previous period - Không filter theo status, lấy TẤT CẢ orders
      const previousOrders = await db('orders')
        .whereRaw(`DATE(${dateColumn}) >= ?`, [prevStartStr])
        .whereRaw(`DATE(${dateColumn}) <= ?`, [prevEndStr])
        .whereNotNull('book_id')
        .whereNotNull(dateColumn)
        .select('id', 'book_id', 'total_price', 'discount_amount', dateColumn);

      // Calculate revenue (Doanh thu) = total_price - discount_amount
      const previousRevenues = calculateOrdersRevenue(previousOrders);
      
      // Calculate profit (Lợi nhuận) = (Giá bán - Giá nhập) * Số lượng - Voucher
      const previousProfits = await calculateOrdersProfit(previousOrders);

      // Group by period
      const previousMap = {};
      previousOrders.forEach((order, index) => {
        const orderDate = new Date(order[dateColumn]);
        let period;
        switch (groupBy) {
          case 'day':
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
            break;
          case 'week':
            const week = Math.ceil((orderDate.getDate() + new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7);
            period = `${orderDate.getFullYear()}-${String(week).padStart(2, '0')}`;
            break;
          case 'month':
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            period = `${orderDate.getFullYear()}`;
            break;
          default:
            period = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
        }

        if (!previousMap[period]) {
          previousMap[period] = { revenue: 0, profit: 0, total_discount: 0, order_count: 0 };
        }
        previousMap[period].revenue += previousRevenues[index] || 0;
        previousMap[period].profit += previousProfits[index] || 0;
        previousMap[period].total_discount += parseFloat(order.discount_amount || 0);
        previousMap[period].order_count += 1;
      });

      const previousData = Object.keys(previousMap)
        .map(period => ({
          period,
          revenue: previousMap[period].revenue,
          profit: previousMap[period].profit,
          total_discount: previousMap[period].total_discount,
          order_count: previousMap[period].order_count
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      // Calculate totals
      const currentRevenueTotal = currentData.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
      const previousRevenueTotal = previousData.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
      const currentProfitTotal = currentData.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
      const previousProfitTotal = previousData.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
      const currentOrdersCount = currentData.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0);
      const previousOrdersCount = previousData.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0);
      const currentDiscount = currentData.reduce((sum, item) => sum + parseFloat(item.total_discount || 0), 0);
      const previousDiscount = previousData.reduce((sum, item) => sum + parseFloat(item.total_discount || 0), 0);

      const revenueChange = previousRevenueTotal > 0 ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100 : 0;
      const profitChange = previousProfitTotal > 0 ? ((currentProfitTotal - previousProfitTotal) / previousProfitTotal) * 100 : 0;
      const ordersChange = previousOrdersCount > 0 ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 : 0;
      const discountChange = previousDiscount > 0 ? ((currentDiscount - previousDiscount) / previousDiscount) * 100 : 0;

      res.status(200).json(createResponse(true, {
        current: {
          revenue: currentRevenueTotal,
          profit: currentProfitTotal,
          orders: currentOrdersCount,
          discount: currentDiscount,
          data: currentData.map(item => ({
            period: item.period,
            revenue: parseFloat(item.revenue || 0),
            profit: parseFloat(item.profit || 0),
            discount: parseFloat(item.total_discount || 0),
            orderCount: parseInt(item.order_count || 0)
          }))
        },
        previous: {
          revenue: previousRevenueTotal,
          profit: previousProfitTotal,
          orders: previousOrdersCount,
          discount: previousDiscount,
          data: previousData.map(item => ({
            period: item.period,
            revenue: parseFloat(item.revenue || 0),
            profit: parseFloat(item.profit || 0),
            discount: parseFloat(item.total_discount || 0),
            orderCount: parseInt(item.order_count || 0)
          }))
        },
        comparison: {
          revenueChange: revenueChange,
          profitChange: profitChange,
          ordersChange: ordersChange,
          discountChange: discountChange,
          revenueDiff: currentRevenueTotal - previousRevenueTotal,
          profitDiff: currentProfitTotal - previousProfitTotal,
          ordersDiff: currentOrdersCount - previousOrdersCount,
          discountDiff: currentDiscount - previousDiscount
        },
        periods: {
          current: { start: startDate, end: endDate },
          previous: { 
            start: prevStartStr, 
            end: prevEndStr
          }
        }
      }, 'Revenue comparison retrieved successfully'));
    } catch (err) {
      console.error('❌ Error retrieving revenue comparison:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json(createResponse(false, null, 'Error retrieving revenue comparison: ' + err.message));
    }
  }
};

module.exports = statisticsController;

