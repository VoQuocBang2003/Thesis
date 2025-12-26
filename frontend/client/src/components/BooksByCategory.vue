<template>
  <div class="books-by-category">
    <div v-for="category in categories" :key="category.id" class="category-section">
      <h2>{{ category.name }} Books</h2>
      <div class="books-list">
        <div v-for="(book) in getBooksByCategory(category.id).slice(0, 5)" :key="book.id" class="book-card" @click="viewBookDetails(book.id)">
          <img :src="book.image || 'https://cdn0.fahasa.com/media/catalog/product/8/9/8935246937136.jpg'" alt="Book cover" class="book-image" />
          <h3>{{ book.title }}</h3>
          <p class="price">{{ formatPrice(book.price) }} VNĐ</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getBooksByCategory } from '../apis/booksApi';
import { getAllCategories } from '../apis/categoriesApi';

export default {
  name: 'BooksByCategory',
  data() {
    return {
      categories: [],
      booksByCategory: {},
    };
  },
  async created() {
    this.categories = await getAllCategories();
    await this.fetchAllBooks();
  },
  methods: {
    async fetchAllBooks() {
      for (const category of this.categories) {
        this.booksByCategory[category.id] = await getBooksByCategory(category.id);
      }
    },
    getBooksByCategory(categoryId) {
      return this.booksByCategory[categoryId] || [];
    },
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value);
    },
    viewBookDetails(bookId) {
      this.$router.push({ name: 'BookDetails', params: { id: bookId } });
    },
  },
};
</script>

<style scoped>
.books-by-category {
  font-family: Arial, sans-serif;
}

.category-section {
  margin-bottom: 40px;
}

.books-by-category h2 {
  font-size: 2em;
  margin-bottom: 15px;
  color: #2c3e50;
  text-align: center;
  position: relative;
  padding-bottom: 10px;
}

.books-by-category h2::after {
  content: '';
  display: block;
  width: 50px;
  height: 4px;
  background-color: #3498db;
  margin: 10px auto 0;
  border-radius: 2px;
}

.books-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.book-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
}

.book-card:hover {
  transform: translateY(-5px);
}

.book-image {
  width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 10px;
}

.price {
  color: #e74c3c;
  font-weight: bold;
  margin-top: 5px;
}
</style> 