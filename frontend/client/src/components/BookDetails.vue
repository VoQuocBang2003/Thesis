<template>
  <div class="book-details-container">
    <div class="book-card">
      <div class="book-image-section">
        <img
          :src="book.image"
          alt="Book cover"
          class="book-image"
        />
      </div>
      <div class="book-info-section">
        <h2 class="book-title">{{ book.title }}</h2>
        <p class="book-price">{{ $t('bookDetails.price') }}: {{ formatPrice(book.price) }} VNĐ</p>
        <div class="button-group">
          <button
            class="action-button"
            @click="addToCart"
          >
            {{ $t('bookDetails.addToCart') }}
          </button>
          <button
            class="action-button"
            @click="addToWishlist"
          >
            {{ $t('bookDetails.addToWishlist') }}
          </button>
        </div>
      </div>
    </div>

    <div class="book-extra-section">
      <h3 class="title-white">{{ book.title }}</h3>
      <p class="desc-label">{{ $t('bookDetails.description') }}:</p>
      <pre class="desc-white">{{ book.description }}</pre>
    </div>

    <!-- Reviews Section -->
    <div class="reviews-section">
      <h3 class="title-white">{{ $t('bookDetails.reviewsAndRatings') }}</h3>
      <div v-if="reviewsLoading" class="loading-reviews">{{ $t('bookDetails.loadingReviews') }}</div>
      <div v-else-if="reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0">
        <div class="rating-summary">
          <div class="average-rating">
            <a-rate :value="reviewsData.averageRating" disabled allow-half />
            <span class="rating-text">{{ reviewsData.averageRating.toFixed(1) }} / 5.0</span>
            <span class="review-count">({{ reviewsData.totalReviews }} {{ $t('bookDetails.reviews') }})</span>
          </div>
        </div>
        <div class="reviews-list">
          <div v-for="review in reviewsData.reviews" :key="review.id" class="review-item">
            <div class="review-header">
              <div class="review-user">
                <a-avatar :src="review.user_image" :size="40">{{ review.username?.charAt(0) }}</a-avatar>
                <div class="review-user-info">
                  <strong>{{ review.username }}</strong>
                  <div class="review-date">{{ formatDate(review.created_at) }}</div>
                </div>
              </div>
              <a-rate :value="review.rating" disabled />
            </div>
            <div v-if="review.comment" class="review-comment">{{ review.comment }}</div>
          </div>
        </div>
      </div>
      <div v-else class="no-reviews">
        <p>{{ $t('bookDetails.noReviews') }}</p>
      </div>
    </div>

    <div class="related-products-section">
      <h3>{{ $t('bookDetails.relatedProducts') }}</h3>
      <div class="related-products-list">
        <div
          v-for="relatedBook in relatedBooks"
          :key="relatedBook.id"
          class="related-book-card"
          @click="viewBookDetails(relatedBook.id)"
        >
          <img
            :src="relatedBook.image"
            alt="Book cover"
            class="related-book-image"
          />
          <h4>{{ relatedBook.title }}</h4>
          <p class="related-book-price">{{ formatPrice(relatedBook.price) }} VNĐ</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getBookById, getAllBooks } from '../apis/booksApi';
import { addToWishlist } from '../apis/wishlistsApi';
import { eventBus } from '../eventBus';
import { addToCart, getCartByUser } from '../apis/cartApi';
import { getReviewsByProduct } from '../apis/reviewsApi';
import moment from 'moment';

export default {
  name: 'BookDetails',
  data() {
    return {
      book: {},
      relatedBooks: [],
      reviewsData: null,
      reviewsLoading: false
    };
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        this.loadBookData(newId);
      }
    }
  },
  methods: {
    async loadBookData(bookId) {
      try {
        this.book = await getBookById(bookId);
        const allBooks = await getAllBooks();
        this.relatedBooks = this.getRandomBooks(allBooks, 5);
        await this.loadReviews(bookId);
      } catch (error) {
        console.error('Error loading book data:', error);
      }
    },
    async loadReviews(bookId) {
      this.reviewsLoading = true;
      try {
        this.reviewsData = await getReviewsByProduct(bookId);
      } catch (error) {
        console.error('Error loading reviews:', error);
        this.reviewsData = { reviews: [], averageRating: 0, totalReviews: 0 };
      } finally {
        this.reviewsLoading = false;
      }
    },
    formatDate(date) {
      return moment(date).format('DD/MM/YYYY HH:mm');
    },
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value);
    },
    getRandomBooks(books, count) {
      const shuffled = books.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
    viewBookDetails(bookId) {
      this.$router.push({ name: 'BookDetails', params: { id: bookId } });
    },
    addToCart: async function () {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        this.$router.push('/login');
        return;
      }

      try {
        await addToCart({
          user_id: user.id,
          book_id: this.book.id,
          quantity: 1
        });

        // 👇 Sau khi thêm, lấy lại cart và đếm số lượng mới
        const response = await getCartByUser(user.id);
        const count = response.length;

        // 👇 Cập nhật số lượng giỏ hàng lên header (hoặc nơi khác dùng)
        eventBus.updateCartCount(count);

        this.$message.success(this.$t('bookDetails.addedToCart'));
      } catch (err) {
        console.error('Add to cart failed', err);
        this.$message.error(this.$t('bookDetails.failedToAddToCart'));
      }
    },
    async addToWishlist() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          alert(this.$t('bookDetails.pleaseLogin'));
          return;
        }
        const response = await addToWishlist({ bookId: this.book.id, userId: user.id });
        if (response.success) {
          alert(this.$t('bookDetails.addedToWishlist'));
        } else if (response.message === 'Item already in wishlist') {
          alert(this.$t('bookDetails.alreadyInWishlist'));
        } else {
          alert(this.$t('bookDetails.addedToWishlist'));
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert(this.$t('bookDetails.errorAddingToWishlist'));
      }
    }
  },
  created() {
    this.loadBookData(this.$route.params.id);
  }
};
</script>

<style scoped>
.title-white {
  color: white;
  font-size: 1rem;
  margin-bottom: 8px;
}

.desc-label {
  color: white;
  font-weight: bold;
  margin-bottom: 4px;
}

.desc-white {
  color: white;
  white-space: pre-wrap; /* Cho phép xuống dòng trong mô tả */
  font-family: inherit;
  background: transparent;
}

.book-details-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background-color: #111;
  color: white;
}

.book-card {
  display: flex;
  max-width: 1300px;
  width: 100%;
  margin-bottom: 20px;
  background-color: transparent;
}

.book-image-section {
  background-image: url('@/assets/product_background.jpg');
  background-size: cover;
  background-position: center;
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: hidden;
}

.book-image {
  width: 90%;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.book-info-section {
  flex: 1;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
}

.book-title {
  font-size: 2rem;
  font-weight: bold;
}

.book-price {
  font-size: 1.5rem;
  color: #ffc107;
}

.button-group {
  display: flex;
  gap: 15px;
}

.action-button {
  padding: 12px 25px;
  background-color: transparent;
  color: #ffc107;
  border: 1px solid #ffc107;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s, color 0.3s;
}

.action-button:hover {
  background-color: #ffc107;
  color: #000;
}

.book-extra-section {
  max-width: 1000px;
  width: 100%;
  background-color: #1a1a1a;
  padding: 20px;
  border: 1px solid #333;
  border-radius: 10px;
  margin-bottom: 20px;
}

.related-products-section {
  max-width: 1000px;
  width: 100%;
  background-color: #1a1a1a;
  padding: 20px;
  border: 1px solid #333;
  border-radius: 10px;
}

.related-products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.related-book-card {
  background-color: #222;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.related-book-card:hover {
  transform: translateY(-5px);
}

.related-book-image {
  width: 100%;
  height: 150px;
  object-fit: contain;
  margin-bottom: 10px;
}

.related-book-price {
  color: #ffc107;
  font-weight: bold;
}

.reviews-section {
  max-width: 1000px;
  width: 100%;
  background-color: #1a1a1a;
  padding: 20px;
  border: 1px solid #333;
  border-radius: 10px;
  margin-bottom: 20px;
}

.rating-summary {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffc107;
}

.review-count {
  color: #888;
  font-size: 0.9rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 16px;
  background-color: #222;
  border-radius: 8px;
  border: 1px solid #333;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-user-info {
  display: flex;
  flex-direction: column;
}

.review-user-info strong {
  color: #fff;
}

.review-date {
  color: #888;
  font-size: 0.85rem;
}

.review-comment {
  color: #ddd;
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading-reviews,
.no-reviews {
  text-align: center;
  padding: 20px;
  color: #888;
}
</style>
