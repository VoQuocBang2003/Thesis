const path = require("path");
const fs = require("fs");
const db = require("../knexfile.js");
const { createResponse } = require("../jsend.js");

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

function formatBookImage(book) {
  if (!book.image) {
    return { ...book, image: '' };
  }
  return {
    ...book,
    image: book.image.startsWith("http") ? book.image : `${BASE_URL}${book.image}`
  };
}

const booksController = {
  getAllBooks: async (req, res) => {
    try {
      // Get all books with category name
      let books = await db("books")
        .select("books.*", "categories.name as category_name")
        .leftJoin("categories", "books.categories_id", "categories.id");

      // Remove duplicates by ID (in case join creates duplicates)
      const uniqueBooks = [];
      const seenIds = new Set();
      for (const book of books) {
        if (!seenIds.has(book.id)) {
          seenIds.add(book.id);
          uniqueBooks.push(book);
        }
      }

      books = uniqueBooks.map(formatBookImage);

      res.status(200).json(createResponse(true, books, "Books retrieved successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error retrieving books"));
    }
  },

  getBookById: async (req, res) => {
    try {
      let book = await db("books")
        .select("books.*", "categories.name as category_name")
        .leftJoin("categories", "books.categories_id", "categories.id")
        .where("books.id", req.params.id)
        .first();

      if (!book) {
        return res.status(404).json(createResponse(false, null, "Book not found"));
      }

      book = formatBookImage(book);

      res.status(200).json(createResponse(true, book, "Book retrieved successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error retrieving book"));
    }
  },

  getBooksByCategory: async (req, res) => {
    try {
      let books = await db("books")
        .select("books.*", "categories.name as category_name")
        .leftJoin("categories", "books.categories_id", "categories.id")
        .where("categories.id", req.params.categoryId);

      books = books.map(formatBookImage);

      res.status(200).json(createResponse(true, books, "Books retrieved by category successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error retrieving books by category"));
    }
  },

  createBook: async (req, res) => {
    try {
      const {
        title,
        language,
        categories_id,
        description,
        price,
        cost_price,
        StockQuantity,
        status,
        image,
      } = req.body;

      let imagePath = null;

      if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
      } else if (image && image.trim() !== '') {
        // Allow web URL or existing path
        imagePath = image;
      }

      const [id] = await db("books").insert({
        title,
        language,
        image: imagePath,
        categories_id,
        description,
        price,
        cost_price: cost_price || 0,
        StockQuantity,
        status,
      });

      let newBook = await db("books").where("id", id).first();
      newBook = formatBookImage(newBook);

      res.status(201).json(createResponse(true, newBook, "Book created successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error creating book"));
    }
  },

  updateBook: async (req, res) => {
    try {
      const {
        title,
        language,
        categories_id,
        description,
        price,
        cost_price,
        StockQuantity,
        status,
        image,
      } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (language !== undefined) updateData.language = language;
      if (categories_id !== undefined) updateData.categories_id = categories_id;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (cost_price !== undefined) updateData.cost_price = cost_price;
      if (StockQuantity !== undefined) updateData.StockQuantity = StockQuantity;
      if (status !== undefined) updateData.status = status;

      if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
      } else if (image !== undefined && image !== null && image.trim() !== '') {
        // Allow web URL or existing path
        updateData.image = image;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json(createResponse(false, null, "No fields provided to update"));
      }

      await db("books").where("id", req.params.id).update(updateData);

      let updatedBook = await db("books").where("id", req.params.id).first();
      updatedBook = formatBookImage(updatedBook);

      res.status(200).json(createResponse(true, updatedBook, "Book updated successfully"));
    } catch (err) {
      console.error("❌ Error in updateBook:", err);
      res.status(500).json(createResponse(false, null, "Error updating book"));
    }
  },

  deleteBook: async (req, res) => {
    try {
      await db("books").where("id", req.params.id).del();
      res.status(200).json(createResponse(true, null, "Book deleted successfully"));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, "Error deleting book"));
    }
  },

  searchBooks: async (req, res) => {
    const { q, query } = req.query;
    const searchQuery = q || query;
    try {
      if (!searchQuery || searchQuery.trim() === '') {
        return res.status(400).json(createResponse(false, null, "Search query is required"));
      }
      
      const trimmedQuery = searchQuery.trim();
      
      // Escape special characters for SQL LIKE query to prevent SQL injection
      // Replace % and _ with escaped versions, and escape backslashes
      const escapedQuery = trimmedQuery
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      
      const searchPattern = `%${escapedQuery}%`;
      
      // Search only in columns that definitely exist: title and description
      // Note: author and publisher columns may not exist in all database schemas
      let books = await db("books")
        .select("books.*", "categories.name as category_name")
        .leftJoin("categories", "books.categories_id", "categories.id")
        .where(function() {
          this.whereRaw("books.title LIKE ?", [searchPattern])
            .orWhereRaw("books.description LIKE ?", [searchPattern]);
        });

      // Remove duplicates by ID (in case join creates duplicates)
      const uniqueBooks = [];
      const seenIds = new Set();
      for (const book of books) {
        if (!seenIds.has(book.id)) {
          seenIds.add(book.id);
          uniqueBooks.push(book);
        }
      }
      books = uniqueBooks;

      books = books.map(formatBookImage);

      res.status(200).json(createResponse(true, books, "Books searched successfully"));
    } catch (error) {
      console.error("Error searching books:", error);
      console.error("Error stack:", error.stack);
      console.error("Search query was:", searchQuery);
      res.status(500).json(createResponse(false, null, error.message || "Error searching books"));
    }
  },
};

module.exports = booksController;
