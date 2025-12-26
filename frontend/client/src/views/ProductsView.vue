<template>
  <div class="products-view-container">
    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          :placeholder="$t('products.searchPlaceholder')"
          @input="searchProducts"
          class="search-input"
        />
        <div class="results-info">
          {{ $t('products.displaying') }} {{ filteredProducts.length }} / {{ products.length }} {{ $t('products.title') }}
        </div>
      </div>
    </div>

    <!-- Main Content with Sidebar -->
    <div class="main-content">
      <!-- Sidebar -->
      <div class="sidebar-container">
        <ProductSidebar
          :books="products"
          :categories="categories"
          @sort-change="handleSortChange"
          @price-change="handlePriceChange"
          @year-change="handleYearChange"
          @filter-change="handleFilterChange"
          @clear-filters="clearAllFilters"
        />
      </div>

      <!-- Products Grid -->
      <div class="products-section">
        <div class="products-header">
          <h2>{{ $t('products.title') }}</h2>
          <div class="view-options">
            <button
              @click="toggleViewMode"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'grid' }"
            >
              {{ $t('products.grid') }}
            </button>
            <button
              @click="toggleViewMode"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'list' }"
            >
              {{ $t('products.list') }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>{{ $t('common.loading') }}</p>
        </div>

        <!-- Products Grid/List -->
        <div v-else-if="paginatedProducts.length > 0" :class="['products-container', viewMode]">
          <div
            v-for="product in paginatedProducts"
            :key="product.id"
            class="product-card"
            @click="viewProductDetails(product.id)"
          >
            <div class="product-image-wrapper">
              <img
                :src="product.image || 'https://via.placeholder.com/150'"
                :alt="product.title"
                loading="lazy"
              />
              <div class="product-overlay">
                <button class="quick-view-btn">{{ $t('common.viewDetails') }}</button>
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="product-author">{{ product.author }}</p>
              <p class="product-publisher">{{ product.publisher }}</p>
              <div class="product-price-section">
                <span class="product-price">{{ formatPrice(product.price) }} VNĐ</span>
                <div class="product-rating" v-if="product.rating">
                  <span class="stars">{{ getStars(product.rating) }}</span>
                  <span class="rating-count">({{ product.ratingCount || 0 }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="no-results">
          <div class="no-results-icon">📚</div>
          <h3>{{ $t('products.noProducts') }}</h3>
          <p>{{ $t('products.noProductsDesc') }}</p>
          <button @click="clearAllFilters" class="clear-filters-btn">
            {{ $t('products.clearFilters') }}
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination-controls">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            ← Trước
          </button>
          <div class="pagination-info">
            Trang {{ currentPage }} / {{ totalPages }}
          </div>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>

    <!-- Gaming ChatBot -->
    <GamingChatBot />
  </div>
</template>

<script>
import { getAllBooks } from '@/apis/booksApi';
import { getAllCategories } from '@/apis/categoriesApi';
import ProductSidebar from '@/components/ProductSidebar.vue';
import GamingChatBot from '@/components/GamingChatBot.vue';

export default {
  name: 'ProductsView',
  components: {
    ProductSidebar,
    GamingChatBot
  },
  data() {
    return {
      products: [],
      categories: [],
      loading: false,
      searchQuery: '',
      currentPage: 1,
      productsPerPage: 12,
      viewMode: 'grid', // 'grid' or 'list'
      
      // Filter states
      sortBy: '',
      priceRange: { min: '', max: '' },
      yearRange: { min: '', max: '' },
      selectedPublishers: [],
      selectedCategories: [],
      selectedAuthors: [],
      selectedLanguages: [],
      selectedRating: ''
    };
  },
  computed: {
    filteredProducts() {
      let filtered = [...this.products];

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(product =>
          product.title.toLowerCase().includes(query) ||
          product.author?.toLowerCase().includes(query) ||
          product.publisher?.toLowerCase().includes(query)
        );
      }

      // Price range filter
      if (this.priceRange.min !== '' || this.priceRange.max !== '') {
        filtered = filtered.filter(product => {
          const price = product.price || 0;
          const min = this.priceRange.min === '' ? 0 : Number(this.priceRange.min);
          const max = this.priceRange.max === '' ? Infinity : Number(this.priceRange.max);
          return price >= min && price <= max;
        });
      }

      // Year range filter
      if (this.yearRange.min !== '' || this.yearRange.max !== '') {
        filtered = filtered.filter(product => {
          const year = product.publicationYear || 0;
          const min = this.yearRange.min === '' ? 0 : Number(this.yearRange.min);
          const max = this.yearRange.max === '' ? Infinity : Number(this.yearRange.max);
          return year >= min && year <= max;
        });
      }

      // Publisher filter
      if (this.selectedPublishers.length > 0) {
        filtered = filtered.filter(product =>
          this.selectedPublishers.includes(product.publisher)
        );
      }

      // Category filter
      if (this.selectedCategories.length > 0) {
        filtered = filtered.filter(product =>
          this.selectedCategories.includes(product.categories_id)
        );
      }

      // Author filter
      if (this.selectedAuthors.length > 0) {
        filtered = filtered.filter(product =>
          this.selectedAuthors.includes(product.author)
        );
      }

      // Language filter
      if (this.selectedLanguages.length > 0) {
        filtered = filtered.filter(product =>
          this.selectedLanguages.includes(product.language)
        );
      }

      // Rating filter
      if (this.selectedRating !== '') {
        filtered = filtered.filter(product => {
          const rating = product.rating || 0;
          return rating >= Number(this.selectedRating);
        });
      }

      // Sorting
      if (this.sortBy) {
        filtered = this.sortProducts(filtered, this.sortBy);
      }

      return filtered;
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.productsPerPage;
      const end = start + this.productsPerPage;
      return this.filteredProducts.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredProducts.length / this.productsPerPage);
    }
  },
  methods: {
    async fetchProducts() {
      this.loading = true;
      try {
        this.products = await getAllBooks();
        this.categories = await getAllCategories();
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        this.loading = false;
      }
    },
    searchProducts() {
      this.currentPage = 1;
    },
    handleSortChange(sortBy) {
      this.sortBy = sortBy;
      this.currentPage = 1;
    },
    handlePriceChange(priceRange) {
      this.priceRange = priceRange;
      this.currentPage = 1;
    },
    handleYearChange(yearRange) {
      this.yearRange = yearRange;
      this.currentPage = 1;
    },
    handleFilterChange(filters) {
      this.selectedPublishers = filters.publishers;
      this.selectedCategories = filters.categories;
      this.selectedAuthors = filters.authors;
      this.selectedLanguages = filters.languages;
      this.selectedRating = filters.rating;
      this.currentPage = 1;
    },
    clearAllFilters() {
      this.searchQuery = '';
      this.sortBy = '';
      this.priceRange = { min: '', max: '' };
      this.yearRange = { min: '', max: '' };
      this.selectedPublishers = [];
      this.selectedCategories = [];
      this.selectedAuthors = [];
      this.selectedLanguages = [];
      this.selectedRating = '';
      this.currentPage = 1;
    },
    sortProducts(products, sortBy) {
      const sorted = [...products];
      
      switch (sortBy) {
        case 'name-asc':
          return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'name-desc':
          return sorted.sort((a, b) => b.title.localeCompare(a.title));
        case 'price-asc':
          return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-desc':
          return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'newest':
          return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        case 'oldest':
          return sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        case 'rating':
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        default:
          return sorted;
      }
    },
    toggleViewMode() {
      this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    },
    viewProductDetails(productId) {
      this.$router.push(`/book/${productId}`);
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value);
    },
    getStars(rating) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      let stars = '★'.repeat(fullStars);
      if (hasHalfStar) stars += '☆';
      return stars;
    }
  },
  mounted() {
    this.fetchProducts();
  }
};
</script>

<style scoped>
.products-view-container {
  background-color: #111;
  min-height: 100vh;
  color: #ffffff;
}

.search-section {
  background: #1a1a1d;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.search-bar {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.search-input {
  flex: 1;
  max-width: 400px;
  padding: 12px 16px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #ffcc00;
}

.search-input::placeholder {
  color: #888;
}

.results-info {
  color: #888;
  font-size: 0.9rem;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  padding: 20px;
  min-height: calc(100vh - 200px);
}

.sidebar-container {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.products-section {
  background: #1a1a1d;
  border-radius: 8px;
  padding: 20px;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.products-header h2 {
  margin: 0;
  color: #ffcc00;
  font-size: 1.5rem;
}

.view-options {
  display: flex;
  gap: 8px;
}

.view-toggle-btn {
  padding: 8px 16px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.view-toggle-btn:hover {
  background: #3a3a3d;
}

.view-toggle-btn.active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #ffcc00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.products-container {
  display: grid;
  gap: 20px;
}

.products-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.products-container.list {
  grid-template-columns: 1fr;
}

.product-card {
  background: #2a2a2d;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255, 204, 0, 0.2);
}

.products-container.list .product-card {
  display: flex;
  align-items: center;
  padding: 16px;
}

.products-container.list .product-image-wrapper {
  width: 120px;
  height: 120px;
  margin-right: 16px;
  flex-shrink: 0;
}

.products-container.list .product-info {
  flex: 1;
}

.product-image-wrapper {
  position: relative;
  overflow: hidden;
}

.products-container.grid .product-image-wrapper {
  aspect-ratio: 3/4;
}

.product-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image-wrapper img {
  transform: scale(1.05);
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.quick-view-btn {
  background: #ffcc00;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.quick-view-btn:hover {
  background: #e6b800;
}

.product-info {
  padding: 16px;
}

.products-container.list .product-info {
  padding: 0;
}

.product-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-author {
  margin: 0 0 4px 0;
  color: #888;
  font-size: 0.9rem;
}

.product-publisher {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 0.85rem;
}

.product-price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  color: #ffcc00;
  font-size: 1.1rem;
  font-weight: 600;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stars {
  color: #ffcc00;
  font-size: 0.9rem;
}

.rating-count {
  color: #888;
  font-size: 0.8rem;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.no-results h3 {
  margin: 0 0 8px 0;
  color: #ffffff;
  font-size: 1.5rem;
}

.no-results p {
  margin: 0 0 20px 0;
  font-size: 1rem;
}

.clear-filters-btn {
  background: #ffcc00;
  color: #000;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.clear-filters-btn:hover {
  background: #e6b800;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.pagination-btn {
  background: #2a2a2d;
  color: #ffffff;
  border: 1px solid #444;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background: #3a3a3d;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #888;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 280px 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .sidebar-container {
    position: static;
    order: 2;
    max-width: none;
  }
  
  .products-section {
    order: 1;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: none;
  }
  
  .products-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .products-container.list .product-card {
    flex-direction: column;
    text-align: center;
  }
  
  .products-container.list .product-image-wrapper {
    width: 100%;
    height: 200px;
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style>
