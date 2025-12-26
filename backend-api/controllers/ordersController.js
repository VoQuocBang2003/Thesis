const db = require("../knexfile.js");
const { createResponse } = require("../jsend.js");
const jwt = require("jsonwebtoken");
const _const = require("../config/constant");

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

// Normalize the stored `book_id` field into an array of items.
// The DB historically stored different formats: JSON array (recommended),
// plain number (e.g. "1"), JSON object, or a comma-separated list.
function parseBookField(raw) {
  if (raw === undefined || raw === null) return [];

  // If it's already an array, return it
  if (Array.isArray(raw)) return raw;

  // If it's a string, try to parse JSON first
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      // if parsed is single value or object, wrap into array
      return [parsed];
    } catch (e) {
      // Not valid JSON. Try comma-separated values (e.g. "1,2,3")
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(s => {
          const v = s.trim();
          // numeric strings -> number
          const num = Number(v);
          return Number.isNaN(num) ? v : num;
        });
      }
      // fallback: single primitive value
      const num = Number(trimmed);
      return Number.isNaN(num) ? [trimmed] : [num];
    }
  }

  // If it's an object (single item), wrap it
  if (typeof raw === 'object') return [raw];

  // Other primitives: wrap into an array
  return [raw];
}
function formatBookImage(book) {
  if (!book || !book.image) {
    return book;
  }
  // Áp dụng logic giống booksController - nếu không phải URL đầy đủ thì thêm BASE_URL
  return {
    ...book,
    image: book.image.startsWith("http") ? book.image : `${BASE_URL}${book.image}`
  };
}

const ordersController = {
  getAllOrders: async (req, res) => {
    try {
      const orders = await db("orders")
        .select("orders.*", "users.username")
        .leftJoin("users", "orders.user_id", "users.id");

      // Parse book_id từ tất cả orders
      const allBookIds = [];
      for (const order of orders) {
        let bookIds = parseBookField(order.book_id);
        // Log raw product ids/objects from order for debugging
        try {
          console.log(`[ordersController:getAllOrders] orderId=${order.id} rawBookField=${JSON.stringify(bookIds)}`);
        } catch (logErr) {
          console.warn('Could not log raw bookIds for order in getAllOrders:', logErr && logErr.message);
        }
        if (Array.isArray(bookIds)) {
          for (const item of bookIds) {
            const bookId = item.book_id || item.id || item;
            if (bookId && !allBookIds.includes(bookId)) {
              allBookIds.push(bookId);
            }
          }
        }
      }

      // Lấy tất cả thông tin sách trong một lần query
      const booksMap = {};
      if (allBookIds.length > 0) {
        const booksData = await db("books").whereIn("id", allBookIds);
        for (const book of booksData) {
          booksMap[book.id] = formatBookImage(book);
        }
        // Log image URLs retrieved from database (after format)
        try {
          for (const bid of Object.keys(booksMap)) {
            const img = booksMap[bid] && booksMap[bid].image ? booksMap[bid].image : '(no image)';
            console.log(`[ordersController:getAllOrders] bookId=${bid} image=${img}`);
          }
        } catch (logErr) {
          console.warn('Could not log book images in getAllOrders:', logErr && logErr.message);
        }
      }

      // Xây dựng dữ liệu order với sách đầy đủ
      for (const order of orders) {
        let bookIds = parseBookField(order.book_id);
        let books = [];
        
        if (Array.isArray(bookIds)) {
          for (const item of bookIds) {
            const bookId = item.book_id || item.id || item;
            const quantity = item.quantity || 1;
            
            if (bookId && booksMap[bookId]) {
              const bookInfo = booksMap[bookId];
              books.push({
                ...bookInfo,
                quantity: quantity,
                subtotal: (bookInfo.price || 0) * quantity
              });
            }
          }
        }
        
        order.books = books;
        delete order.book_id;

        // Lấy thông tin voucher nếu có
        if (order.voucher_id) {
          try {
            const voucher = await db("vouchers")
              .where("id", order.voucher_id)
              .first();
            
            if (voucher) {
              order.voucher = {
                id: voucher.id,
                code: voucher.code,
                name: voucher.name,
                type: voucher.type,
                value: voucher.value,
                discount_amount: order.discount_amount || 0
              };
            }
          } catch (voucherErr) {
            // Ignore voucher errors
          }
        }
      }

      res
        .status(200)
        .json(createResponse(true, orders, "Orders retrieved successfully"));
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json(createResponse(false, null, "Error retrieving orders"));
    }
  },

  getOrderById: async (req, res) => {
    try {
      const order = await db("orders")
        .select("orders.*", "users.username")
        .leftJoin("users", "orders.user_id", "users.id")
        .where("orders.id", req.params.id)
        .first();

      if (!order) {
        return res
          .status(404)
          .json(createResponse(false, null, "Order not found"));
      }

      let bookIds = parseBookField(order.book_id);
      // Log raw product ids/objects for this order
      try {
        console.log(`[ordersController:getOrderById] orderId=${order.id} rawBookField=${JSON.stringify(bookIds)}`);
      } catch (logErr) {
        console.warn('Could not log raw bookIds for order in getOrderById:', logErr && logErr.message);
      }
      
      // Lấy danh sách ID sách
      const bookIdList = [];
      if (Array.isArray(bookIds)) {
        for (const item of bookIds) {
          const bookId = item.book_id || item.id || item;
          if (bookId && !bookIdList.includes(bookId)) {
            bookIdList.push(bookId);
          }
        }
      }

      // Lấy tất cả thông tin sách trong một lần query
      const booksMap = {};
      if (bookIdList.length > 0) {
        const booksData = await db("books").whereIn("id", bookIdList);
        for (const book of booksData) {
          booksMap[book.id] = formatBookImage(book);
        }
        // Log image URLs retrieved from database (after format)
        try {
          for (const bid of Object.keys(booksMap)) {
            const img = booksMap[bid] && booksMap[bid].image ? booksMap[bid].image : '(no image)';
            console.log(`[ordersController:getOrderById] bookId=${bid} image=${img}`);
          }
        } catch (logErr) {
          console.warn('Could not log book images in getOrderById:', logErr && logErr.message);
        }
      }

      // Xây dựng dữ liệu sách
      let books = [];
      if (Array.isArray(bookIds)) {
        for (const item of bookIds) {
          const bookId = item.book_id || item.id || item;
          const quantity = item.quantity || 1;
          
          if (bookId && booksMap[bookId]) {
            const bookInfo = booksMap[bookId];
            books.push({
              ...bookInfo,
              quantity: quantity,
              subtotal: (bookInfo.price || 0) * quantity
            });
          }
        }
      }
      
      order.books = books;
      delete order.book_id;

      // Lấy thông tin voucher nếu có
      if (order.voucher_id) {
        try {
          const voucher = await db("vouchers")
            .where("id", order.voucher_id)
            .first();
          
          if (voucher) {
            order.voucher = {
              id: voucher.id,
              code: voucher.code,
              name: voucher.name,
              type: voucher.type,
              value: voucher.value,
              discount_amount: order.discount_amount || 0
            };
          }
        } catch (voucherErr) {
          console.warn("Could not fetch voucher info:", voucherErr.message);
        }
      }

      res
        .status(200)
        .json(createResponse(true, order, "Order retrieved successfully"));
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json(createResponse(false, null, "Error retrieving order"));
    }
  },

  createOrder: async (req, res) => {
    try {
      const { book_id, total_price, quantity, user_id, shipping_address, payment_method, voucher_code } = req.body;
      
      let finalPrice = total_price;
      let discountAmount = 0;
      let voucherId = null;
      let appliedVoucherCode = null;

      // Validate and apply voucher if provided
      if (voucher_code) {
        try {
          const vouchersController = require('./vouchersController');
          
          // Chuẩn bị cart items từ book_id để validate
          const cartItems = Array.isArray(book_id) ? book_id.map(item => {
            const bookId = typeof item === 'object' ? (item.book_id || item.id) : item;
            const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
            
            // Lấy giá từ database nếu chưa có
            return {
              book_id: bookId,
              id: bookId,
              quantity: quantity
            };
          }) : [];

          // Lấy giá cho các sản phẩm
          if (cartItems.length > 0) {
            const bookIds = cartItems.map(item => item.book_id);
            const books = await db('books').whereIn('id', bookIds).select('id', 'price');
            const bookPriceMap = {};
            books.forEach(book => {
              bookPriceMap[book.id] = book.price;
            });
            
            cartItems.forEach(item => {
              if (!item.price && bookPriceMap[item.book_id]) {
                item.price = bookPriceMap[item.book_id];
              }
            });
          }

          const validationResult = await vouchersController.validateVoucherHelper(
            voucher_code,
            total_price,
            user_id,
            cartItems
          );

          if (validationResult && validationResult.voucher) {
            discountAmount = validationResult.discount || 0;
            finalPrice = validationResult.finalAmount || total_price;
            voucherId = validationResult.voucher.id;
            appliedVoucherCode = validationResult.voucher.code;

            // Record voucher usage
            await db('vouchers')
              .where('id', voucherId)
              .increment('used_count', 1);

            // Record user voucher usage
            if (user_id) {
              await db('user_voucher_usage').insert({
                user_id: user_id,
                voucher_id: voucherId,
                order_id: null, // Will be updated after order creation
              });
            }
          }
        } catch (voucherError) {
          console.error('Voucher validation error:', voucherError);
          // Continue without voucher if validation fails
        }
      }

      // book_id là mảng id sách, quantity là tổng số lượng
      const [id] = await db("orders").insert({
        book_id: JSON.stringify(book_id),
        total_price: finalPrice,
        quantity,
        user_id,
        shipping_address: shipping_address || null,
        payment_method: payment_method || 'cod',
        voucher_id: voucherId,
        discount_amount: discountAmount,
        voucher_code: appliedVoucherCode,
      });

      // Update user_voucher_usage with order_id
      if (voucherId && user_id) {
        await db('user_voucher_usage')
          .where('user_id', user_id)
          .where('voucher_id', voucherId)
          .whereNull('order_id')
          .orderBy('used_at', 'desc')
          .limit(1)
          .update({ order_id: id });
      }

      // Trừ số lượng sách tương ứng với quantity từng sách trong cart
      if (Array.isArray(book_id) && Array.isArray(req.body.cart)) {
        for (const item of req.body.cart) {
          // item: { book_id, quantity }
          await db("books")
            .where("id", item.book_id)
            .decrement("StockQuantity", item.quantity);
        }
      }

      const newOrder = await db("orders").where("id", id).first();
      res
        .status(201)
        .json(createResponse(true, newOrder, "Order created successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error creating order"));
    }
  },

  updateOrder: async (req, res) => {
    try {
      await db("orders").where("id", req.params.id).update(req.body);
      const updatedOrder = await db("orders")
        .where("id", req.params.id)
        .first();
      res
        .status(200)
        .json(createResponse(true, updatedOrder, "Order updated successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error updating order"));
    }
  },

  updateOrderStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      // Nếu chuyển sang Rejected hoặc Canceled thì hoàn tác số lượng
      if (status && (status.toLowerCase() === 'rejected' || status.toLowerCase() === 'canceled' || status.toLowerCase() === 'cancel order')) {
        const order = await db("orders").where("id", id).first();
        if (order) {
          const books = parseBookField(order.book_id);
          if (Array.isArray(books)) {
            for (const item of books) {
              if (typeof item === 'object' && item.book_id && item.quantity) {
                await db("books").where("id", item.book_id).increment("StockQuantity", item.quantity);
              } else if (typeof item === 'object' && item.id && item.quantity) {
                await db("books").where("id", item.id).increment("StockQuantity", item.quantity);
              } else {
                await db("books").where("id", item).increment("StockQuantity", 1);
              }
            }
          }
        }
      }
      const result = await db("orders").where("id", id).update({ status });
      if (result === 0) {
        return res
          .status(404)
          .json(createResponse(false, null, "Order not found"));
      }
      // Trả về order mới nhất cho client/admin
      const updatedOrder = await db("orders").where("id", id).first();
      res
        .status(200)
        .json(
          createResponse(
            true,
            updatedOrder,
            "Order status updated successfully"
          )
        );
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json(createResponse(false, null, "Error updating order status"));
    }
  },

  deleteOrder: async (req, res) => {
    try {
      await db("orders").where("id", req.params.id).del();
      res
        .status(200)
        .json(createResponse(true, null, "Order deleted successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error deleting order"));
    }
  },

  searchOrders: async (req, res) => {
    const { query } = req.query;
    try {
      const orders = await db("orders")
        .select("orders.*", "users.username")
        .leftJoin("users", "orders.user_id", "users.id")
        .where("orders.status", "like", `%${query}%`)
        .orWhere("orders.user_id", "like", `%${query}%`)
        .orWhere("orders.id", "like", `%${query}%`);

      // Parse book_id giống các API khác
      orders.forEach((order) => {
        order.books = parseBookField(order.book_id);
        delete order.book_id;
      });

      res
        .status(200)
        .json(createResponse(true, orders, "Orders searched successfully"));
    } catch (error) {
      console.error("Error searching orders:", error);
      res
        .status(500)
        .json(createResponse(false, null, "Error searching orders"));
    }
  },

  getOrderByUserId: async (req, res) => {
    const { user_id } = req.params;
    try {
      const orders = await db("orders")
        .select("orders.*", "users.username")
        .leftJoin("users", "orders.user_id", "users.id")
        .where("orders.user_id", user_id);

      // Parse JSON book_id → books[]
      orders.forEach((order) => {
        order.books = parseBookField(order.book_id);
        delete order.book_id;
      });

      res.status(200).json({
        success: true,
        data: orders,
        message: "Orders retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting orders by user ID:", error);
      res.status(500).json({
        success: false,
        data: null,
        message: "Error retrieving orders",
      });
    }
  },

  cancelOrder: async (req, res) => {
    const { id } = req.params;
    try {
      // Lấy lại đơn hàng để hoàn tác số lượng
      const order = await db("orders").where("id", id).first();
      if (!order) {
        return res.status(404).json(createResponse(false, null, "Order not found"));
      }
      const books = parseBookField(order.book_id);
      if (Array.isArray(books)) {
        for (const item of books) {
          if (typeof item === 'object' && item.book_id && item.quantity) {
            await db("books").where("id", item.book_id).increment("StockQuantity", item.quantity);
          } else if (typeof item === 'object' && item.id && item.quantity) {
            await db("books").where("id", item.id).increment("StockQuantity", item.quantity);
          } else {
            await db("books").where("id", item).increment("StockQuantity", 1);
          }
        }
      }

      const result = await db("orders")
        .where("id", id)
        .update({ status: "canceled" });

      if (result === 0) {
        return res
          .status(404)
          .json(createResponse(false, null, "Order not found"));
      }

      res
        .status(200)
        .json(createResponse(true, null, "Order canceled successfully"));
    } catch (error) {
      console.error("Error canceling order:", error);
      res
        .status(500)
        .json(createResponse(false, null, "Error canceling order"));
    }
  },

  // API mới cho frontend - lấy lịch sử đơn hàng của user hiện tại
  getMyOrders: async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(createResponse(false, null, "Token required"));
    }

    jwt.verify(token, _const.JWT_ACCESS_KEY, async (err, decodedToken) => {
      if (err) {
        return res.status(401).json(createResponse(false, null, "Invalid token"));
      }

      try {
        const userId = decodedToken.user.id;
        
        const orders = await db("orders")
          .select("orders.*", "users.username")
          .leftJoin("users", "orders.user_id", "users.id")
          .where("orders.user_id", userId)
          .orderBy("orders.order_date", "desc");

        // Parse JSON book_id và join với bảng books để lấy thông tin chi tiết
        for (let order of orders) {
          const books = parseBookField(order.book_id);
          const bookDetails = [];
          
          for (const item of books) {
            let bookId, quantity;
            
            if (typeof item === 'object' && item.book_id && item.quantity) {
              bookId = item.book_id;
              quantity = item.quantity;
            } else if (typeof item === 'object' && item.id && item.quantity) {
              bookId = item.id;
              quantity = item.quantity;
            } else {
              bookId = item;
              quantity = 1;
            }
            
            const book = await db("books").where("id", bookId).first();
            if (book) {
              // Check if user has already reviewed this product for this order
              const existingReview = await db("reviews")
                .where("user_id", userId)
                .where("book_id", bookId)
                .where("order_id", order.id)
                .first();
              
              bookDetails.push({
                book: book,
                quantity: quantity,
                hasReviewed: !!existingReview,
                review: existingReview || null
              });
            }
          }
          
          order.items = bookDetails;
          delete order.book_id;
        }

        res.status(200).json({
          status: 'success',
          data: orders,
          message: "Order history retrieved successfully"
        });
      } catch (error) {
        console.error("Error getting order history:", error);
        res.status(500).json(createResponse(false, null, "Error retrieving order history"));
      }
    });
  },
};

module.exports = ordersController;
