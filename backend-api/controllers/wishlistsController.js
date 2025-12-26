// const db = require('../knexfile.js');
// const { createResponse } = require('../jsend.js');

// const wishlistsController = {
//     getAllWishlists: async (req, res) => {
//         try {
//             const wishlists = await db('wishlists')
//                 .select('wishlists.*', 'users.username', 'books.title')
//                 .leftJoin('users', 'wishlists.user_id', 'users.id')
//                 .leftJoin('books', 'wishlists.book_id', 'books.id');
//             res.status(200).json(createResponse(true, wishlists, 'Wishlists retrieved successfully'));
//         } catch (err) {
//             console.error(err);
//             res.status(500).json(createResponse(false, null, 'Error retrieving wishlists'));
//         }
//     },

//     getWishlistById: async (req, res) => {
//         try {
//             const wishlist = await db('wishlists')
//                 .select('wishlists.*', 'users.username', 'books.title')
//                 .leftJoin('users', 'wishlists.user_id', 'users.id')
//                 .leftJoin('books', 'wishlists.book_id', 'books.id')
//                 .where('wishlists.id', req.params.id)
//                 .first();
//             if (!wishlist) {
//                 return res.status(404).json(createResponse(false, null, 'Wishlist item not found'));
//             }
//             res.status(200).json(createResponse(true, wishlist, 'Wishlist item retrieved successfully'));
//         } catch (err) {
//             console.error(err);
//             res.status(500).json(createResponse(false, null, 'Error retrieving wishlist item'));
//         }
//     },

//     createWishlist: async (req, res) => {
//         try {
//             const [id] = await db('wishlists').insert(req.body);
//             const newWishlist = await db('wishlists').where('id', id).first();
//             res.status(201).json(createResponse(true, newWishlist, 'Wishlist item created successfully'));
//         } catch (err) {
//             console.error(err);
//             res.status(500).json(createResponse(false, null, 'Error creating wishlist item'));
//         }
//     },

//     deleteWishlist: async (req, res) => {
//         try {
//             await db('wishlists').where('id', req.params.id).del();
//             res.status(200).json(createResponse(true, null, 'Wishlist item deleted successfully'));
//         } catch (err) {
//             console.error(err);
//             res.status(500).json(createResponse(false, null, 'Error deleting wishlist item'));
//         }
//     },

//     getWishlistByUserId: async (req, res) => {
//         try {
//             const userId = req.params.user_id;
//             if (!userId) {
//                 return res.status(400).json({ error: 'Missing userId' });
//             }
//             const wishlist = await db('wishlists')
//                 .select('wishlists.*', 'books.title', 'books.image', 'books.price')
//                 .leftJoin('books', 'wishlists.book_id', 'books.id')
//                 .where('wishlists.user_id', userId);
            
//             if (wishlist.length === 0) {
//                 return res.status(404).json(createResponse(false, null, 'No wishlist items found for this user'));
//             }
//             res.status(200).json(createResponse(true, wishlist, 'Wishlist items retrieved successfully'));
//         } catch (err) {
//             console.error(err);
//             res.status(500).json(createResponse(false, null, 'Error retrieving wishlist items'));
//         }
//     },

//     addToWishlist: async (req, res) => {
//         try {
//             const { user_id, book_id } = req.body;
            
//             const existingItem = await db('wishlists')
//                 .where({ user_id, book_id })
//                 .first();
            
//             if (existingItem) {
//                 return res.status(400).json(createResponse(false, null, 'Item already in wishlist'));
//             }

//             const [id] = await db('wishlists').insert({ user_id, book_id });
//             const newWishlistItem = await db('wishlists')
//                 .select('wishlists.*', 'books.title','books.image', 'books.price')
//                 .leftJoin('books', 'wishlists.book_id', 'books.id')
//                 .where('wishlists.id', id)
//                 .first();
            
//             res.status(201).json(createResponse(true, newWishlistItem, 'Item added to wishlist successfully'));
//         } catch (err) {
//             console.error(err);
//             res.status(500).json(createResponse(false, null, 'Error adding item to wishlist'));
//         }
//     },

//     removeFromWishlist: async (req, res) => {
//          try {
//              const { user_id, book_id } = req.params;
            
//              const deletedCount = await db('wishlists')
//                  .where({ user_id, book_id })
//                  .del();
            
//              if (deletedCount === 0) {
//                  return res.status(404).json(createResponse(false, null, 'Wishlist item not found'));
//              }
            
//              res.status(200).json(createResponse(true, null, 'Item removed from wishlist successfully'));
//          } catch (err) {
//              console.error(err);
//              res.status(500).json(createResponse(false, null, 'Error removing item from wishlist'));
//          }
//      }

//     removeFromWishlist: async (req, res) => {
//     try {
//         const wishlistId = req.params.id; // Lấy id từ tham số URL

//         // Thực hiện câu lệnh xóa theo id của wishlist
//         const deletedCount = await db('wishlists')
//             .where('id', wishlistId) // Xóa dựa trên id của wishlist
//             .del();
        
//         if (deletedCount === 0) {
//             return res.status(404).json(createResponse(false, null, 'Wishlist item not found'));
//         }
        
//         res.status(200).json(createResponse(true, null, 'Item removed from wishlist successfully'));
//     } catch (err) {
//         console.error(err);
//         res.status(500).json(createResponse(false, null, 'Error removing item from wishlist'));
//     }
// }
// };

// module.exports = wishlistsController;

const db = require("../knexfile.js");
const { createResponse } = require("../jsend.js");

const wishlistsController = {
    getAllWishlists: async (req, res) => {
        try {
            const wishlists = await db('wishlists')
                .select('wishlists.*', 'users.username', 'books.title')
                .leftJoin('users', 'wishlists.user_id', 'users.id')
                .leftJoin('books', 'wishlists.book_id', 'books.id');
            res.status(200).json(createResponse(true, wishlists, 'Wishlists retrieved successfully'));
        } catch (err) {
            console.error(err);
            res.status(500).json(createResponse(false, null, 'Error retrieving wishlists'));
        }
    },

    getWishlistById: async (req, res) => {
        try {
            const wishlist = await db('wishlists')
                .select('wishlists.*', 'users.username', 'books.title')
                .leftJoin('users', 'wishlists.user_id', 'users.id')
                .leftJoin('books', 'wishlists.book_id', 'books.id')
                .where('wishlists.id', req.params.id)
                .first();
            if (!wishlist) {
                return res.status(404).json(createResponse(false, null, 'Wishlist item not found'));
            }
            res.status(200).json(createResponse(true, wishlist, 'Wishlist item retrieved successfully'));
        } catch (err) {
            console.error(err);
            res.status(500).json(createResponse(false, null, 'Error retrieving wishlist item'));
        }
    },

    createWishlist: async (req, res) => {
        try {
            const { userId, bookId } = req.body;

            console.log(userId, bookId)
    
            // Kiểm tra giá trị của userId và bookId trước khi tiếp tục
            if (!userId || !bookId) {
                return res.status(400).json({ success: false, message: 'User ID and Book ID are required' });
            }
    
            const existingItem = await db('wishlists')
                .where({ user_id: userId, book_id: bookId })
                .first();
    
            if (existingItem) {
                return res.status(400).json({ success: false, message: 'Item already in wishlist' });
            }
    
            const [id] = await db('wishlists').insert({ user_id: userId, book_id: bookId });
            const newWishlist = await db('wishlists')
                .select('wishlists.*', 'books.title','books.image', 'books.price')
                .leftJoin('books', 'wishlists.book_id', 'books.id')
                .where('wishlists.id', id)
                .first();
    
            res.status(201).json({ success: true, data: newWishlist, message: 'Wishlist item created successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error creating wishlist item' });
        }
    },
    

    deleteWishlist: async (req, res) => {
        try {
            await db('wishlists').where('id', req.params.id).del();
            res.status(200).json(createResponse(true, null, 'Wishlist item deleted successfully'));
        } catch (err) {
            console.error(err);
            res.status(500).json(createResponse(false, null, 'Error deleting wishlist item'));
        }
    },

    getWishlistByUserId: async (req, res) => {
        try {
            const userId = req.params.user_id;

            // Kiểm tra giá trị của userId trước khi tiếp tục
            if (!userId) {
                return res.status(400).json({ success: false, message: 'User ID is required' });
            }

            const wishlist = await db('wishlists')
                .select('wishlists.*', 'books.title', 'books.image', 'books.price')
                .leftJoin('books', 'wishlists.book_id', 'books.id')
                .where('wishlists.user_id', userId);
            
            res.status(200).json(createResponse(true, wishlist, 'Wishlist items retrieved successfully'));
        } catch (err) {
            console.error(err);
            res.status(500).json(createResponse(false, null, 'Error retrieving wishlist items'));
        }
    },

    addToWishlist: async (req, res) => {
        try {
            const { userId, bookId } = req.body;
            
            const existingItem = await db('wishlists')
                .where({ user_id: userId, book_id: bookId })
                .first();
            
            if (existingItem) {
                return res.status(200).json(createResponse(false, null, 'Item already in wishlist'));
            }

            const [id] = await db('wishlists').insert({ user_id: userId, book_id: bookId });
            const newWishlistItem = await db('wishlists')
                .select('wishlists.*', 'books.title','books.image', 'books.price')
                .leftJoin('books', 'wishlists.book_id', 'books.id')
                .where('wishlists.id', id)
                .first();
            
            res.status(201).json(createResponse(true, newWishlistItem, 'Item added to wishlist successfully'));
        } catch (err) {
            console.error(err);
            res.status(500).json(createResponse(false, null, 'Error adding item to wishlist'));
        }
    },

    removeFromWishlist: async (req, res) => {
        try {
            const { userId, bookId } = req.body;
            
            if (!userId || !bookId) {
                return res.status(400).json(createResponse(false, null, 'User ID and Book ID are required'));
            }

            const deletedCount = await db('wishlists')
                .where({ user_id: userId, book_id: bookId })
                .del();
            
            if (deletedCount === 0) {
                return res.status(404).json(createResponse(false, null, 'Wishlist item not found'));
            }
            
            res.status(200).json(createResponse(true, null, 'Item removed from wishlist successfully'));
        } catch (err) {
            console.error(err);
            res.status(500).json(createResponse(false, null, 'Error removing item from wishlist'));
        }
    }
};

module.exports = wishlistsController;
