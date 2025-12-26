const db = require('../knexfile.js');
const { createResponse } = require('../jsend.js');

const vouchersController = {
  // Get all vouchers (admin)
  getAllVouchers: async (req, res) => {
    try {
      const vouchers = await db('vouchers')
        .select('*')
        .orderBy('created_at', 'desc');

      res.status(200).json(createResponse(true, vouchers, 'Vouchers retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving vouchers'));
    }
  },

  // Get active vouchers (client)
  getActiveVouchers: async (req, res) => {
    try {
      // Get today's date in local timezone
      const now = new Date();
      const today = now.getFullYear().toString().padStart(4, '0') + '-' +
                    (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
                    now.getDate().toString().padStart(2, '0');
      
      const vouchers = await db('vouchers')
        .select('*')
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      // Filter vouchers by date in application (convert to local dates for accurate comparison)
      const activeVouchers = vouchers.filter(v => {
        const convertToLocalDate = (dateStr) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          return date.getFullYear().toString().padStart(4, '0') + '-' +
                 (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
                 date.getDate().toString().padStart(2, '0');
        };
        
        const startDate = convertToLocalDate(v.start_date);
        const endDate = convertToLocalDate(v.end_date);
        
        // Check date range
        if (startDate && startDate > today) return false;
        if (endDate && endDate < today) return false;
        
        // Check usage limit
        if (v.usage_limit && v.used_count >= v.usage_limit) return false;
        
        return true;
      });

      res.status(200).json(createResponse(true, activeVouchers, 'Active vouchers retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving active vouchers'));
    }
  },

  // Get voucher by code
  getVoucherByCode: async (req, res) => {
    try {
      const { code } = req.params;
      
      // Get today's date in local timezone
      const now = new Date();
      const today = now.getFullYear().toString().padStart(4, '0') + '-' +
                    (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
                    now.getDate().toString().padStart(2, '0');

      const voucher = await db('vouchers')
        .where('code', code.toUpperCase())
        .where('is_active', true)
        .first();

      if (!voucher) {
        return res.status(404).json(createResponse(false, null, 'Voucher not found or not active'));
      }

      // Convert dates to local format for comparison
      const convertToLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.getFullYear().toString().padStart(4, '0') + '-' +
               (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
               date.getDate().toString().padStart(2, '0');
      };

      const startDate = convertToLocalDate(voucher.start_date);
      const endDate = convertToLocalDate(voucher.end_date);

      // Check date range
      if (startDate && startDate > today) {
        return res.status(400).json(createResponse(false, null, `Voucher is not valid yet. It will be available from ${startDate}`));
      }

      if (endDate && endDate < today) {
        return res.status(400).json(createResponse(false, null, `Voucher has expired. It was valid until ${endDate}`));
      }

      // Check usage limit
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        return res.status(400).json(createResponse(false, null, 'Voucher has reached usage limit'));
      }

      res.status(200).json(createResponse(true, voucher, 'Voucher retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving voucher'));
    }
  },

  // Helper function to validate voucher (can be called directly)
  validateVoucherHelper: async (code, orderAmount, userId, cartItems = null) => {
    if (!code || !orderAmount) {
      throw new Error('Code and order amount are required');
    }

    // Get today's date in local timezone (YYYY-MM-DD)
    const now = new Date();
    const today = now.getFullYear().toString().padStart(4, '0') + '-' +
                  (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
                  now.getDate().toString().padStart(2, '0');
    const codeUpper = code.toUpperCase();

    console.log(`🔍 Validating voucher: ${codeUpper}, orderAmount: ${orderAmount}, userId: ${userId}, today: ${today}`);

    // Tìm voucher trước (không filter date để debug)
    const voucherCheck = await db('vouchers')
      .where('code', codeUpper)
      .first();

    if (!voucherCheck) {
      console.log(`❌ Voucher ${codeUpper} not found in database`);
      throw new Error('Voucher not found');
    }

    console.log(`📋 Found voucher:`, {
      id: voucherCheck.id,
      code: voucherCheck.code,
      is_active: voucherCheck.is_active,
      start_date: voucherCheck.start_date,
      end_date: voucherCheck.end_date,
      used_count: voucherCheck.used_count,
      usage_limit: voucherCheck.usage_limit,
      applicable_products: voucherCheck.applicable_products
    });

    // Kiểm tra từng điều kiện để có error message rõ ràng
    if (!voucherCheck.is_active) {
      console.log(`❌ Voucher ${codeUpper} is not active`);
      throw new Error('Voucher is not active');
    }

    // Convert dates to local date format (YYYY-MM-DD) for accurate comparison
    const convertToLocalDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.getFullYear().toString().padStart(4, '0') + '-' +
             (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
             date.getDate().toString().padStart(2, '0');
    };

    const startDate = convertToLocalDate(voucherCheck.start_date);
    const endDate = convertToLocalDate(voucherCheck.end_date);

    if (startDate && startDate > today) {
      console.log(`❌ Voucher ${codeUpper} has not started yet. Start date: ${startDate}, Today: ${today}`);
      throw new Error(`Voucher is not valid yet. It will be available from ${startDate}`);
    }

    if (endDate && endDate < today) {
      console.log(`❌ Voucher ${codeUpper} has expired. End date: ${endDate}, Today: ${today}`);
      throw new Error(`Voucher has expired. It was valid until ${endDate}`);
    }

    const voucher = voucherCheck;

    // Kiểm tra applicable_products nếu có
    let applicableProductIds = null;
    if (voucher.applicable_products) {
      try {
        applicableProductIds = typeof voucher.applicable_products === 'string' 
          ? JSON.parse(voucher.applicable_products) 
          : voucher.applicable_products;
        
        if (!Array.isArray(applicableProductIds) || applicableProductIds.length === 0) {
          applicableProductIds = null; // Nếu rỗng thì coi như áp dụng cho tất cả
        }
      } catch (parseErr) {
        console.warn('Could not parse applicable_products:', parseErr.message);
        applicableProductIds = null;
      }
    }

    // Nếu voucher chỉ áp dụng cho sản phẩm cụ thể, kiểm tra cart items
    if (applicableProductIds && cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const cartBookIds = cartItems.map(item => {
        const bookId = item.book_id || item.id || item;
        return typeof bookId === 'object' ? bookId.book_id || bookId.id : bookId;
      }).filter(id => id);

      // Kiểm tra TẤT CẢ sản phẩm trong giỏ hàng phải nằm trong danh sách được phép
      const allProductsApplicable = cartBookIds.every(bookId => {
        const bookIdInt = parseInt(bookId);
        const bookIdStr = String(bookId);
        return applicableProductIds.includes(bookIdInt) || applicableProductIds.includes(bookIdStr);
      });

      if (!allProductsApplicable) {
        console.log(`❌ Voucher ${codeUpper} is only applicable to specific products, but cart contains other products`);
        // Lấy tên sản phẩm được phép để hiển thị
        try {
          const products = await db('books')
            .whereIn('id', applicableProductIds)
            .select('title')
            .limit(5);
          const productNames = products.map(p => p.title).join(', ');
          
          // Lấy tên sản phẩm không được phép trong giỏ hàng
          const nonApplicableIds = cartBookIds.filter(bookId => {
            const bookIdInt = parseInt(bookId);
            const bookIdStr = String(bookId);
            return !applicableProductIds.includes(bookIdInt) && !applicableProductIds.includes(bookIdStr);
          });
          
          const nonApplicableProducts = await db('books')
            .whereIn('id', nonApplicableIds)
            .select('title')
            .limit(3);
          const nonApplicableNames = nonApplicableProducts.map(p => p.title).join(', ');
          
          throw new Error(`Voucher này chỉ áp dụng cho các sản phẩm: ${productNames}${products.length < applicableProductIds.length ? '...' : ''}. Vui lòng xóa các sản phẩm khác (${nonApplicableNames}${nonApplicableProducts.length < nonApplicableIds.length ? '...' : ''}) khỏi giỏ hàng.`);
        } catch (err) {
          if (err.message.includes('Voucher này chỉ áp dụng')) {
            throw err;
          }
          throw new Error('Voucher này chỉ áp dụng cho các sản phẩm cụ thể. Vui lòng xóa các sản phẩm khác khỏi giỏ hàng.');
        }
      }

      // Tính orderAmount cho tất cả sản phẩm (vì tất cả đều được phép)
      let applicableAmount = 0;
      for (const item of cartItems) {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        applicableAmount += price * quantity;
      }

      // Cập nhật orderAmount để tính discount đúng
      orderAmount = applicableAmount;
      console.log(`📦 Voucher applies to specific products only. All cart items are applicable. Applicable amount: ${applicableAmount}`);
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      console.log(`❌ Voucher ${codeUpper} has reached usage limit: ${voucher.used_count}/${voucher.usage_limit}`);
      throw new Error(`Voucher has reached usage limit (${voucher.used_count}/${voucher.usage_limit})`);
    }

    // Check minimum order amount (chỉ kiểm tra với applicable amount nếu có)
    if (orderAmount < voucher.min_order_amount) {
      console.log(`❌ Order amount ${orderAmount} is less than minimum ${voucher.min_order_amount}`);
      throw new Error(`Minimum order amount is ${voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ. Your order is ${orderAmount.toLocaleString('vi-VN')} VNĐ`);
    }

    // Check user usage limit
    if (userId && voucher.user_limit) {
      try {
        const userUsage = await db('user_voucher_usage')
          .where('user_id', userId)
          .where('voucher_id', voucher.id)
          .select(db.raw('SUM(usage_count) as total_usage'))
          .first();

        const totalUsage = parseInt(userUsage?.total_usage || 0);
        if (totalUsage >= voucher.user_limit) {
          console.log(`❌ User ${userId} has reached usage limit for voucher ${codeUpper}: ${totalUsage}/${voucher.user_limit}`);
          throw new Error(`You have reached the usage limit for this voucher (${totalUsage}/${voucher.user_limit})`);
        }
      } catch (usageErr) {
        // Nếu lỗi là về usage limit thì throw lại
        if (usageErr.message.includes('usage limit')) {
          throw usageErr;
        }
        // Nếu lỗi khác (ví dụ: table không tồn tại), log và bỏ qua check này
        console.warn('⚠️ Could not check user voucher usage:', usageErr.message);
      }
    }

    // Calculate discount
    let discount = 0;
    if (voucher.type === 'percentage') {
      discount = (orderAmount * parseFloat(voucher.value)) / 100;
      if (voucher.max_discount) {
        discount = Math.min(discount, parseFloat(voucher.max_discount));
      }
    } else {
      discount = parseFloat(voucher.value) || 0;
    }

    // Đảm bảo discount là số hợp lệ
    discount = parseFloat(discount) || 0;
    if (isNaN(discount)) {
      discount = 0;
    }

    const finalAmount = Math.max(0, parseFloat(orderAmount) - discount);

    console.log(`✅ Voucher ${codeUpper} validated successfully:`, {
      originalAmount: orderAmount,
      discount: discount,
      finalAmount: finalAmount,
      applicableProducts: applicableProductIds
    });

    return {
      voucher: {
        ...voucher,
        applicable_products: applicableProductIds
      },
      discount: discount,
      finalAmount: finalAmount,
      originalAmount: parseFloat(orderAmount) || 0,
      applicableProducts: applicableProductIds
    };
  },

  // Validate voucher for order
  validateVoucher: async (req, res) => {
    try {
      const { code, orderAmount, userId, cartItems } = req.body;
      
      // Validate input
      if (!code) {
        return res.status(400).json(createResponse(false, null, 'Voucher code is required'));
      }
      if (!orderAmount || orderAmount <= 0) {
        return res.status(400).json(createResponse(false, null, 'Order amount must be greater than 0'));
      }

      console.log(`📥 Received voucher validation request:`, { code, orderAmount, userId, cartItemsCount: cartItems?.length || 0 });

      const result = await module.exports.validateVoucherHelper(code, orderAmount, userId, cartItems);
      res.status(200).json(createResponse(true, result, 'Voucher validated successfully'));
    } catch (err) {
      console.error('❌ Error validating voucher:', err);
      console.error('Stack:', err.stack);
      
      // Phân loại lỗi để trả về status code phù hợp
      let statusCode = 400; // Mặc định là 400 (Bad Request)
      const errorMessage = err.message || 'Error validating voucher';
      
      // Các lỗi validation (400)
      if (errorMessage.includes('required') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('expired') ||
          errorMessage.includes('not active') ||
          errorMessage.includes('not valid yet') ||
          errorMessage.includes('limit') ||
          errorMessage.includes('Minimum order amount')) {
        statusCode = 400;
      } else {
        // Lỗi server (500)
        statusCode = 500;
      }
      
      res.status(statusCode).json(createResponse(false, null, errorMessage));
    }
  },

  // Create voucher (admin)
  createVoucher: async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        type,
        value,
        min_order_amount,
        max_discount,
        usage_limit,
        user_limit,
        start_date,
        end_date,
        is_active,
        applicable_products
      } = req.body;

      // Validate required fields
      if (!code || !name || !type || !value || !start_date || !end_date) {
        return res.status(400).json(createResponse(false, null, 'Missing required fields'));
      }

      // Check if code already exists
      const existing = await db('vouchers').where('code', code.toUpperCase()).first();
      if (existing) {
        return res.status(400).json(createResponse(false, null, 'Voucher code already exists'));
      }

      // Xử lý applicable_products
      let applicableProductsJson = null;
      if (applicable_products && Array.isArray(applicable_products) && applicable_products.length > 0) {
        // Chuyển thành array số nguyên
        applicableProductsJson = JSON.stringify(applicable_products.map(id => parseInt(id)).filter(id => !isNaN(id)));
      }

      const [id] = await db('vouchers').insert({
        code: code.toUpperCase(),
        name,
        description,
        type,
        value,
        min_order_amount: min_order_amount || 0,
        max_discount: max_discount || null,
        usage_limit: usage_limit || null,
        user_limit: user_limit || 1,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        applicable_products: applicableProductsJson,
      });

      const newVoucher = await db('vouchers').where('id', id).first();
      res.status(201).json(createResponse(true, newVoucher, 'Voucher created successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error creating voucher'));
    }
  },

  // Update voucher (admin)
  updateVoucher: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // If code is being updated, check for duplicates
      if (updateData.code) {
        const existing = await db('vouchers')
          .where('code', updateData.code.toUpperCase())
          .where('id', '!=', id)
          .first();
        if (existing) {
          return res.status(400).json(createResponse(false, null, 'Voucher code already exists'));
        }
        updateData.code = updateData.code.toUpperCase();
      }

      // Xử lý applicable_products
      if (updateData.applicable_products !== undefined) {
        if (updateData.applicable_products && Array.isArray(updateData.applicable_products) && updateData.applicable_products.length > 0) {
          updateData.applicable_products = JSON.stringify(updateData.applicable_products.map(id => parseInt(id)).filter(id => !isNaN(id)));
        } else {
          updateData.applicable_products = null;
        }
      }

      await db('vouchers').where('id', id).update(updateData);
      const updatedVoucher = await db('vouchers').where('id', id).first();

      res.status(200).json(createResponse(true, updatedVoucher, 'Voucher updated successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error updating voucher'));
    }
  },

  // Delete voucher (admin)
  deleteVoucher: async (req, res) => {
    try {
      const { id } = req.params;
      await db('vouchers').where('id', id).del();
      res.status(200).json(createResponse(true, null, 'Voucher deleted successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error deleting voucher'));
    }
  },

  // Record voucher usage
  recordVoucherUsage: async (req, res) => {
    try {
      const { userId, voucherId, orderId } = req.body;

      // Update voucher used count
      await db('vouchers')
        .where('id', voucherId)
        .increment('used_count', 1);

      // Record user usage
      if (userId) {
        await db('user_voucher_usage').insert({
          user_id: userId,
          voucher_id: voucherId,
          order_id: orderId || null,
        });
      }

      res.status(200).json(createResponse(true, null, 'Voucher usage recorded successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error recording voucher usage'));
    }
  },
};

module.exports = vouchersController;


