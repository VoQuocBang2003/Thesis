<template>
  <div class="product-sidebar">
    <div class="sidebar-header">
      <h3>{{ $t('products.productFilter') }}</h3>
      <button @click="clearAllFilters" class="clear-filters-btn">
        {{ $t('products.clearAll') }}
      </button>
    </div>

    <!-- Sắp xếp -->
    <div class="filter-section">
      <h4>{{ $t('products.sortBy') }}</h4>
      <select v-model="sortBy" @change="handleSortChange" class="filter-select">
        <option value="">{{ $t('products.default') }}</option>
        <option value="name-asc">{{ $t('products.nameAsc') }}</option>
        <option value="name-desc">{{ $t('products.nameDesc') }}</option>
        <option value="price-asc">{{ $t('products.priceLowToHigh') }}</option>
        <option value="price-desc">{{ $t('products.priceHighToLow') }}</option>
        <option value="newest">{{ $t('products.newest') }}</option>
        <option value="oldest">{{ $t('products.oldest') }}</option>
        <option value="rating">{{ $t('products.highestRating') }}</option>
      </select>
    </div>

    <!-- Khoảng giá -->
    <div class="filter-section">
      <h4>{{ $t('products.priceRange') }}</h4>
      <div class="price-range">
        <div class="price-inputs">
          <input
            type="number"
            v-model="priceRange.min"
            :placeholder="$t('products.from')"
            class="price-input"
            @input="handlePriceChange"
          />
          <span>-</span>
          <input
            type="number"
            v-model="priceRange.max"
            :placeholder="$t('products.to')"
            class="price-input"
            @input="handlePriceChange"
          />
        </div>
        <div class="price-presets">
          <button
            v-for="preset in pricePresets"
            :key="preset.value"
            @click="setPricePreset(preset)"
            :class="{ active: isPricePresetActive(preset) }"
            class="preset-btn"
          >
            {{ $t(`products.pricePresets.${preset.key}`) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Theo hãng/Nhà xuất bản -->
    <div class="filter-section">
      <h4>{{ $t('products.byManufacturer') }}</h4>
      <div class="checkbox-group">
        <label
          v-for="publisher in publishers"
          :key="publisher"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :value="publisher"
            v-model="selectedPublishers"
            @change="handleFilterChange"
          />
          <span class="checkmark"></span>
          {{ publisher }}
        </label>
      </div>
    </div>

    <!-- Theo loại/Category -->
    <div class="filter-section">
      <h4>{{ $t('products.byCategory') }}</h4>
      <div class="checkbox-group">
        <label
          v-for="category in categories"
          :key="category.id"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :value="category.id"
            v-model="selectedCategories"
            @change="handleFilterChange"
          />
          <span class="checkmark"></span>
          {{ category.name }}
        </label>
      </div>
    </div>

    <!-- Theo tác giả -->
    <div class="filter-section">
      <h4>{{ $t('products.byBrand') }}</h4>
      <div class="checkbox-group">
        <label
          v-for="author in authors"
          :key="author"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :value="author"
            v-model="selectedAuthors"
            @change="handleFilterChange"
          />
          <span class="checkmark"></span>
          {{ author }}
        </label>
      </div>
    </div>

    <!-- Đánh giá -->
    <div class="filter-section">
      <h4>{{ $t('products.rating') }}</h4>
      <div class="rating-filter">
          <button
            v-for="rating in ratingOptions"
            :key="rating.value"
            @click="setRatingFilter(rating.value)"
            :class="{ active: selectedRating === rating.value }"
            class="rating-btn"
          >
            <span class="stars">{{ rating.stars }}</span>
            <span class="rating-text">{{ $t(`products.ratingOptions.${rating.key}`) }}</span>
          </button>
      </div>
    </div>

    <!-- Năm xuất bản -->
    <div class="filter-section">
      <h4>{{ $t('products.productionYear') }}</h4>
      <div class="year-range">
        <input
          type="number"
          v-model="yearRange.min"
          :placeholder="$t('products.fromYear')"
          class="year-input"
          @input="handleYearChange"
        />
        <span>-</span>
        <input
          type="number"
          v-model="yearRange.max"
          :placeholder="$t('products.toYear')"
          class="year-input"
          @input="handleYearChange"
        />
      </div>
    </div>

    <!-- Ngôn ngữ -->
    <div class="filter-section">
      <h4>{{ $t('products.productionCountry') }}</h4>
      <div class="checkbox-group">
        <label
          v-for="language in languages"
          :key="language"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :value="language"
            v-model="selectedLanguages"
            @change="handleFilterChange"
          />
          <span class="checkmark"></span>
          {{ language }}
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductSidebar',
  props: {
    books: {
      type: Array,
      default: () => []
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      sortBy: '',
      priceRange: {
        min: '',
        max: ''
      },
      yearRange: {
        min: '',
        max: ''
      },
      selectedPublishers: [],
      selectedCategories: [],
      selectedAuthors: [],
      selectedLanguages: [],
      selectedRating: '',
      pricePresets: [
        { label: '', value: { min: 0, max: 50000 }, key: 'under50k' },
        { label: '', value: { min: 50000, max: 100000 }, key: '50kTo100k' },
        { label: '', value: { min: 100000, max: 200000 }, key: '100kTo200k' },
        { label: '', value: { min: 200000, max: 500000 }, key: '200kTo500k' },
        { label: '', value: { min: 500000, max: Infinity }, key: 'over500k' }
      ],
      ratingOptions: [
        { value: 5, stars: '★★★★★', text: '', key: '5stars' },
        { value: 4, stars: '★★★★☆', text: '', key: '4starsAndUp' },
        { value: 3, stars: '★★★☆☆', text: '', key: '3starsAndUp' },
        { value: 2, stars: '★★☆☆☆', text: '', key: '2starsAndUp' },
        { value: 1, stars: '★☆☆☆☆', text: '', key: '1starAndUp' }
      ]
    };
  },
  computed: {
    publishers() {
      const publishers = new Set();
      this.books.forEach(book => {
        if (book.publisher) {
          publishers.add(book.publisher);
        }
      });
      return Array.from(publishers).sort();
    },
    authors() {
      const authors = new Set();
      this.books.forEach(book => {
        if (book.author) {
          authors.add(book.author);
        }
      });
      return Array.from(authors).sort();
    },
    languages() {
      const languages = new Set();
      this.books.forEach(book => {
        if (book.language) {
          languages.add(book.language);
        }
      });
      return Array.from(languages).sort();
    }
  },
  methods: {
    handleSortChange() {
      this.$emit('sort-change', this.sortBy);
    },
    handlePriceChange() {
      this.$emit('price-change', this.priceRange);
    },
    handleYearChange() {
      this.$emit('year-change', this.yearRange);
    },
    handleFilterChange() {
      this.$emit('filter-change', {
        publishers: this.selectedPublishers,
        categories: this.selectedCategories,
        authors: this.selectedAuthors,
        languages: this.selectedLanguages,
        rating: this.selectedRating
      });
    },
    setPricePreset(preset) {
      this.priceRange = { ...preset.value };
      this.handlePriceChange();
    },
    isPricePresetActive(preset) {
      return this.priceRange.min === preset.value.min && 
             this.priceRange.max === preset.value.max;
    },
    setRatingFilter(rating) {
      this.selectedRating = this.selectedRating === rating ? '' : rating;
      this.handleFilterChange();
    },
    clearAllFilters() {
      this.sortBy = '';
      this.priceRange = { min: '', max: '' };
      this.yearRange = { min: '', max: '' };
      this.selectedPublishers = [];
      this.selectedCategories = [];
      this.selectedAuthors = [];
      this.selectedLanguages = [];
      this.selectedRating = '';
      
      this.$emit('clear-filters');
    }
  }
};
</script>

<style scoped>
.product-sidebar {
  background: #1a1a1d;
  border-radius: 8px;
  padding: 20px;
  color: #ffffff;
  height: fit-content;
  position: sticky;
  top: 20px;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.sidebar-header h3 {
  margin: 0;
  color: #ffcc00;
  font-size: 1.2rem;
}

.clear-filters-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.clear-filters-btn:hover {
  background: #cc3333;
}

.filter-section {
  margin-bottom: 25px;
}

.filter-section h4 {
  margin: 0 0 12px 0;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
}

.filter-select {
  width: 100%;
  padding: 8px 12px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ffffff;
  font-size: 0.9rem;
}

.filter-select:focus {
  outline: none;
  border-color: #ffcc00;
}

.price-range, .year-range {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.price-inputs, .year-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.price-input, .year-input {
  flex: 1;
  min-width: 80px;
  padding: 8px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ffffff;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.price-input:focus, .year-input:focus {
  outline: none;
  border-color: #ffcc00;
}

.price-presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-btn {
  padding: 6px 12px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.preset-btn:hover {
  background: #3a3a3d;
}

.preset-btn.active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  position: relative;
}

.checkbox-item input[type="checkbox"] {
  opacity: 0;
  position: absolute;
}

.checkmark {
  width: 18px;
  height: 18px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 3px;
  margin-right: 8px;
  position: relative;
  transition: all 0.3s;
}

.checkbox-item input[type="checkbox"]:checked + .checkmark {
  background: #ffcc00;
  border-color: #ffcc00;
}

.checkbox-item input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #000;
  font-size: 12px;
  font-weight: bold;
}

.rating-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #2a2a2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.rating-btn:hover {
  background: #3a3a3d;
}

.rating-btn.active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}

.stars {
  color: #ffcc00;
  font-size: 1rem;
}

.rating-btn.active .stars {
  color: #000;
}

.rating-text {
  font-size: 0.85rem;
}

/* Scrollbar styling */
.checkbox-group::-webkit-scrollbar {
  width: 6px;
}

.checkbox-group::-webkit-scrollbar-track {
  background: #2a2a2d;
  border-radius: 3px;
}

.checkbox-group::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.checkbox-group::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-sidebar {
    position: static;
    max-width: none;
    width: 100%;
  }
  
  .price-inputs, .year-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .price-input, .year-input {
    min-width: auto;
  }
}
</style>
