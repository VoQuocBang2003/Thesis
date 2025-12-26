<template>
  <div class="order-management">
    <div class="page-header">
      <h2>{{ $t('orders.title') }}</h2>
      <p>{{ $t('orders.subtitle') }}</p>
    </div>

    <a-table
      :columns="columns"
      :dataSource="orders"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        
        <template v-if="column.key === 'order_date'">
          {{ formatDate(record.order_date) }}
        </template>
        
        <template v-if="column.key === 'total_price'">
          {{ formatCurrency(record.total_price) }}
        </template>
        
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button type="link" @click="showViewModal(record)" size="small">
              <EyeOutlined /> {{ $t('orders.viewDetails') }}
            </a-button>
            <a-button 
              v-if="record.status?.toLowerCase() !== 'canceled' && record.status?.toLowerCase() !== 'delivered'"
              type="link" 
              danger 
              @click="showCancelModal(record)" 
              size="small"
            >
              <CloseOutlined /> {{ $t('orders.cancelOrder') }}
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- Modal: Xem chi tiết đơn hàng -->
    <a-modal
      v-model:open="isViewModalVisible"
      :title="$t('orders.orderDetails')"
      :footer="null"
      width="900px"
    >
      <div v-if="selectedOrder">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="$t('orders.orderId')">
            #{{ selectedOrder.id }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.orderDate')">
            {{ formatDate(selectedOrder.order_date) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.status')">
            <a-tag :color="getStatusColor(selectedOrder.status)">
              {{ getStatusText(selectedOrder.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.quantity')">
            {{ selectedOrder.quantity }}
          </a-descriptions-item>
          <a-descriptions-item v-if="selectedOrder.voucher" :label="$t('orders.voucherCode')" :span="2">
            <a-tag color="green">
              {{ selectedOrder.voucher.code }} - {{ selectedOrder.voucher.name }}
            </a-tag>
            <span style="margin-left: 8px; color: #52c41a; font-weight: bold">
              -{{ formatCurrency(selectedOrder.voucher.discount_amount || selectedOrder.discount_amount || 0) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.totalBeforeDiscount')" v-if="selectedOrder.voucher">
            {{ formatCurrency((selectedOrder.total_price || 0) + (selectedOrder.voucher.discount_amount || selectedOrder.discount_amount || 0)) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.totalPrice')" :span="selectedOrder.voucher ? 1 : 2">
            <span :style="{ fontWeight: 'bold', color: selectedOrder.voucher ? '#e74c3c' : 'inherit', fontSize: selectedOrder.voucher ? '1.1em' : '1em' }">
              {{ formatCurrency(selectedOrder.total_price) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.shippingAddress')" :span="2">
            <div v-if="userAddress">
              {{ userAddress }}
            </div>
            <div v-else class="text-muted">
              <ExclamationCircleOutlined /> {{ $t('orders.noAddress') }}
              <router-link to="/profile">{{ $t('orders.updateAddress') }}</router-link>
            </div>
          </a-descriptions-item>
        </a-descriptions>

        <div style="margin-top: 24px">
          <h4>{{ $t('orders.productsInOrder') }}</h4>
          <a-list
            :data-source="selectedOrderBooks"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar :src="getImageUrl(item.image)" shape="square" :size="80" />
                  </template>
                  <template #title>
                    <strong>{{ item.title }}</strong>
                  </template>
                  <template #description>
                    <div>
                      <p v-if="item.author"><strong>{{ $t('orders.brand') }}:</strong> {{ item.author }}</p>
                      <p v-if="item.publisher"><strong>{{ $t('orders.manufacturer') }}:</strong> {{ item.publisher }}</p>
                      <p v-if="item.publicationYear"><strong>{{ $t('orders.productionYear') }}:</strong> {{ item.publicationYear }}</p>
                      <p v-if="item.genre"><strong>{{ $t('orders.category') }}:</strong> {{ item.genre }}</p>
                      <p v-if="item.category_name"><strong>{{ $t('orders.category') }}:</strong> {{ item.category_name }}</p>
                      <p v-if="item.description"><strong>{{ $t('bookDetails.description') }}:</strong> {{ item.description }}</p>
                    </div>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <div class="order-item-actions">
                    <div><strong>{{ $t('orders.quantity') }}:</strong> {{ item.quantity }}</div>
                    <div><strong>{{ $t('orders.unitPrice') }}:</strong> {{ formatCurrency(item.price) }}</div>
                    <div><strong>{{ $t('orders.subtotal') }}:</strong> {{ formatCurrency(item.price * item.quantity) }}</div>
                    <div style="margin-top: 12px;">
                      <!-- Hiển thị nút đánh giá nếu đã đánh giá -->
                      <a-button 
                        v-if="item.hasReviewed === true"
                        type="default"
                        size="small"
                        @click="viewReview(item)"
                      >
                        <StarOutlined /> {{ $t('orders.viewReview') }}
                      </a-button>
                      <!-- Hiển thị nút đánh giá nếu chưa đánh giá và status phù hợp -->
                      <a-button 
                        v-else-if="canReviewOrder(selectedOrder?.status)"
                        type="primary"
                        size="small"
                        @click="showReviewModal(item)"
                      >
                        <StarOutlined /> {{ $t('orders.review') }}
                      </a-button>
                    </div>
                  </div>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>

    <!-- Modal: Xác nhận hủy đơn hàng -->
    <a-modal
      v-model:open="isCancelModalVisible"
      :title="$t('orders.confirmCancel')"
      @ok="handleCancelOrder"
      @cancel="handleCancelOrderCancel"
      :okText="$t('orders.cancelOrder')"
      :cancelText="$t('productManagement.no')"
      okType="danger"
    >
      <p>{{ $t('orders.cancelConfirm') }} #{{ formData.id }}?</p>
    </a-modal>

    <!-- Modal: Đánh giá sản phẩm -->
    <a-modal
      v-model:open="isReviewModalVisible"
      :title="selectedReview?.id ? $t('orders.editReview') : $t('orders.reviewProduct')"
      @ok="selectedReview?.id ? handleUpdateReview() : handleSubmitReview()"
      @cancel="handleCancelReview"
      :okText="selectedReview?.id ? $t('orders.updateReview') : $t('orders.submitReview')"
      :cancelText="$t('common.cancel')"
      :confirmLoading="reviewSubmitting"
    >
      <div v-if="selectedReviewItem">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <a-avatar :src="selectedReviewItem.image" shape="square" :size="60" />
            <div>
              <strong>{{ selectedReviewItem.title }}</strong>
              <div style="color: #666; font-size: 12px;">{{ $t('orders.quantity') }}: {{ selectedReviewItem.quantity }}</div>
            </div>
          </div>
        </div>
        <a-form :model="reviewForm" layout="vertical">
          <a-form-item :label="$t('orders.ratingStars')" required>
            <a-rate v-model:value="reviewForm.rating" :count="5" />
          </a-form-item>
          <a-form-item :label="$t('orders.comment')">
            <a-textarea
              v-model:value="reviewForm.comment"
              :rows="4"
              :placeholder="$t('orders.commentPlaceholder')"
              :maxlength="500"
              show-count
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- Modal: Xem đánh giá -->
    <a-modal
      v-model:open="isViewReviewModalVisible"
      :title="$t('orders.yourReview')"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedReview">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <a-avatar :src="selectedReviewItem?.image" shape="square" :size="60" />
            <div>
              <strong>{{ selectedReviewItem?.title }}</strong>
            </div>
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <a-rate :value="selectedReview.rating" disabled />
          <span style="margin-left: 8px; color: #666;">{{ formatDate(selectedReview.created_at) }}</span>
        </div>
        <div v-if="selectedReview.comment" style="padding: 12px; background: #fafafa; border-radius: 4px;">
          <p style="margin: 0; white-space: pre-wrap;">{{ selectedReview.comment }}</p>
        </div>
        <div v-else style="color: #999; font-style: italic;">{{ $t('orders.noComment') }}</div>
        <div style="margin-top: 16px; text-align: right;">
          <a-button @click="editReview">{{ $t('orders.editReview') }}</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { i18n } from '@/i18n';
import { getOrderHistory, cancelOrder } from '@/apis/ordersApi';
import { createReview, updateReview, getReviewableProducts } from '@/apis/reviewsApi';
import { message } from 'ant-design-vue';
import moment from 'moment';
import { getBookById } from '@/apis/booksApi';
import { EyeOutlined, CloseOutlined, ExclamationCircleOutlined, StarOutlined } from '@ant-design/icons-vue';

const t = (key, params) => i18n.t(key, params);

const orders = ref([]);
const loading = ref(false);
const isViewModalVisible = ref(false);
const isCancelModalVisible = ref(false);
const isReviewModalVisible = ref(false);
const isViewReviewModalVisible = ref(false);
const selectedOrder = ref(null);
const selectedOrderBooks = ref([]);
const selectedReviewItem = ref(null);
const selectedReview = ref(null);
const reviewSubmitting = ref(false);
const userAddress = ref('');
const formData = ref({
  id: null,
  status: '',
});
const reviewForm = ref({
  rating: 5,
  comment: '',
});

const columns = computed(() => [
  { title: t('orders.orderId'), dataIndex: 'id', key: 'id' },
  { title: t('orders.orderDate'), dataIndex: 'order_date', key: 'order_date' },
  { title: t('orders.quantity'), dataIndex: 'quantity', key: 'quantity' },
  { title: t('orders.totalPrice'), dataIndex: 'total_price', key: 'total_price' },
  { title: t('orders.status'), dataIndex: 'status', key: 'status' },
  { title: t('common.actions'), key: 'actions' },
]);

const fetchOrders = async () => {
  loading.value = true;
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      const response = await getOrderHistory();
      if (response.data && response.data.status === 'success') {
        orders.value = response.data.data;
      } else {
        orders.value = response.data || [];
      }
      userAddress.value = user.address || '';
    } else {
      message.error(t('auth.mustLogin'));
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    message.error(t('orders.loadError'));
  } finally {
    loading.value = false;
  }
};

const showViewModal = async (record) => {
  selectedOrder.value = record;
  try {
    const books = [];
    
    // Use items from API if available (includes review info)
        if (record.items && record.items.length > 0) {
      for (const item of record.items) {
        const book = item.book || item;
        const hasReviewed = item.hasReviewed !== undefined ? item.hasReviewed : false;
        // Ensure all book fields are properly mapped
        books.push({
          ...book,
          id: book.id || item.book?.id || item.id,
          title: book.title || book.name || item.title,
              image: getImageUrl(book.image || book.image_url || item.image || item.image_url || ''),
          price: book.price || item.price,
          author: book.author || item.author || '',
          publisher: book.publisher || item.publisher || '',
          publicationYear: book.publicationYear || item.publicationYear || '',
          genre: book.genre || item.genre || book.category_name || item.category_name || '',
          category_name: book.category_name || item.category_name || '',
          description: book.description || item.description || '',
          quantity: item.quantity,
          hasReviewed: hasReviewed,
          review: item.review || null
        });
      }
    } else {
      // Fallback to old method - check reviews manually
      const bookObjs = record.books || [];
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      for (const item of bookObjs) {
        let bookData, quantity;
        
        if (item.title && item.price && item.image) {
          bookData = item;
          quantity = item.quantity || 1;
        } else {
          const bookId = item.book_id || item.id || item;
          bookData = await getBookById(bookId);
          quantity = item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1);
        }
        
        // Check if review exists for this product in this order
        let hasReviewed = false;
        let review = null;
        if (user && user.id && record.id && bookData.id) {
          try {
            // Try to fetch review info from API
            const response = await getReviewableProducts(record.id);
            const reviewableProducts = response.data || response || [];
            const productReview = reviewableProducts.find(p => {
              const pBookId = p.book?.id || p.book_id || p.id;
              return pBookId === bookData.id || pBookId === parseInt(bookData.id);
            });
            if (productReview) {
              hasReviewed = productReview.hasReviewed || false;
              review = productReview.review || null;
            }
          } catch (err) {
            console.warn('Could not fetch review info:', err);
            // Default to false if API call fails
            hasReviewed = false;
          }
        }
        
        // Ensure all fields are properly mapped
        books.push({
          ...bookData,
          id: bookData.id,
          title: bookData.title || bookData.name,
          image: getImageUrl(bookData.image || bookData.image_url || ''),
          price: bookData.price,
          author: bookData.author || '',
          publisher: bookData.publisher || '',
          publicationYear: bookData.publicationYear || '',
          genre: bookData.genre || bookData.category_name || '',
          category_name: bookData.category_name || '',
          description: bookData.description || '',
          quantity,
          hasReviewed,
          review
        });
      }
    }
    selectedOrderBooks.value = books;
  } catch (err) {
    console.error('Error fetching product details:', err);
    selectedOrderBooks.value = [];
  }
  isViewModalVisible.value = true;
};

// Safely resolve image URLs. Some runtime environments may not expose
// `import.meta.env` (or it may be undefined) — guard access with try/catch
// to avoid breaking the UI when building/running under different toolchains.
let __VITE_API_URL_FALLBACK = 'http://127.0.0.1:3100';
try {
  // access at module-eval time; if it throws, fallback will be used
  const maybe = import.meta?.env?.VITE_API_URL;
  if (maybe) __VITE_API_URL_FALLBACK = maybe;
} catch (e) {
  // ignore and keep fallback
}

const getImageUrl = (image) => {
  if (!image) return '';
  try {
    if (typeof image === 'string' && image.startsWith('http')) return image;
  } catch (e) {
    console.warn('getImageUrl parse error', e);
  }
  const base = __VITE_API_URL_FALLBACK;
  if (typeof image === 'string' && image.startsWith('/uploads/')) return `${base}${image}`;
  return `${base}/uploads/${image}`;
};

const showCancelModal = (record) => {
  formData.value = { id: record.id, status: record.status };
  isCancelModalVisible.value = true;
};

const handleCancelOrder = async () => {
  try {
    await cancelOrder(formData.value.id);
    message.success(t('orders.cancelSuccess'));
    isCancelModalVisible.value = false;
    fetchOrders();
  } catch (error) {
    message.error(error.message || t('orders.cancelFailed'));
  }
};

const handleCancelOrderCancel = () => {
  isCancelModalVisible.value = false;
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    confirmed: 'blue',
    shipping: 'purple',
    delivered: 'green',
    canceled: 'red',
    'cancel order': 'red',
  };
  return colors[status?.toLowerCase()] || 'default';
};

const getStatusText = (status) => {
  const statusKey = status?.toLowerCase();
  const statusMap = {
    pending: t('orders.statusPending'),
    confirmed: t('orders.statusConfirmed'),
    shipping: t('orders.statusShipping'),
    delivered: t('orders.statusDelivered'),
    canceled: t('orders.statusCanceled'),
    'cancel order': t('orders.statusCanceled'),
  };
  return statusMap[statusKey] || status;
};

const canReviewOrder = (status) => {
  if (!status) {
    return false;
  }
  const statusLower = status.toLowerCase().trim();
  // Cho phép đánh giá khi đơn hàng đã giao (hỗ trợ cả tiếng Việt và tiếng Anh)
  // Kiểm tra nhiều biến thể của status "đã giao"
  return statusLower === 'delivered' || 
         statusLower === 'đã giao' || 
         statusLower === 'da giao' ||
         statusLower.includes('giao') ||
         statusLower === 'completed' ||
         statusLower === 'đã giao hàng' ||
         statusLower === 'da giao hang';
};

const formatDate = (date) => {
  return moment(date).format('DD/MM/YYYY HH:mm');
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const showReviewModal = (item) => {
  selectedReviewItem.value = item;
  selectedReview.value = null; // Reset review when creating new
  reviewForm.value = {
    rating: 5,
    comment: '',
  };
  isReviewModalVisible.value = true;
};

const handleSubmitReview = async () => {
  if (!reviewForm.value.rating || reviewForm.value.rating < 1) {
    message.error(t('orders.pleaseSelectRating'));
    return;
  }

  if (!selectedReviewItem.value || !selectedReviewItem.value.id) {
    message.error(t('orders.productNotFound'));
    return;
  }

  if (!selectedOrder.value || !selectedOrder.value.id) {
    message.error(t('orders.orderNotFound'));
    return;
  }

  reviewSubmitting.value = true;
  try {
    const bookId = selectedReviewItem.value.id || selectedReviewItem.value.book_id;
    const orderId = selectedOrder.value.id;
    
    console.log('📝 Submitting review:', {
      bookId,
      orderId,
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment
    });
    
    await createReview({
      bookId: parseInt(bookId),
      orderId: parseInt(orderId),
      rating: parseInt(reviewForm.value.rating),
      comment: reviewForm.value.comment || null,
    });
    message.success(t('orders.reviewSubmittedSuccess'));
    isReviewModalVisible.value = false;
    // Refresh orders to get updated review status
    await fetchOrders();
    // Refresh modal if still open
    if (isViewModalVisible.value) {
      await showViewModal(selectedOrder.value);
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    message.error(error.response?.data?.message || t('orders.reviewSubmitError'));
  } finally {
    reviewSubmitting.value = false;
  }
};

const handleCancelReview = () => {
  isReviewModalVisible.value = false;
  selectedReviewItem.value = null;
};

const viewReview = (item) => {
  selectedReviewItem.value = item;
  selectedReview.value = item.review;
  isViewReviewModalVisible.value = true;
};

const editReview = () => {
  if (selectedReview.value) {
    // Keep the review object for update
    reviewForm.value = {
      rating: selectedReview.value.rating,
      comment: selectedReview.value.comment || '',
    };
    isViewReviewModalVisible.value = false;
    isReviewModalVisible.value = true;
  }
};

const handleUpdateReview = async () => {
  if (!reviewForm.value.rating || reviewForm.value.rating < 1) {
    message.error(t('orders.pleaseSelectRating'));
    return;
  }

  if (!selectedReview.value || !selectedReview.value.id) {
    // If no review ID, create new review
    await handleSubmitReview();
    return;
  }

  reviewSubmitting.value = true;
  try {
    await updateReview(selectedReview.value.id, {
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment || null,
    });
    message.success(t('orders.reviewUpdatedSuccess'));
    isReviewModalVisible.value = false;
    // Refresh orders to get updated review status
    await fetchOrders();
    // Refresh modal if still open
    if (isViewModalVisible.value) {
      await showViewModal(selectedOrder.value);
    }
  } catch (error) {
    console.error('Error updating review:', error);
    message.error(error.response?.data?.message || t('orders.reviewUpdateError'));
  } finally {
    reviewSubmitting.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.order-management {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #1890ff;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.order-item-actions {
  text-align: right;
  min-width: 150px;
}

.order-item-actions div {
  margin-bottom: 4px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

.book-detail {
  display: flex;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.book-image {
  width: 100px;
  height: auto;
  margin-right: 16px;
  border-radius: 4px;
}

.book-info {
  flex: 1;
}

.book-info h3 {
  margin: 0 0 8px 0;
  color: #1890ff;
}

.book-info p {
  margin: 4px 0;
  color: #666;
}

.ant-descriptions-item-label {
  font-weight: 600;
}

.ant-list-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ant-list-item:last-child {
  border-bottom: none;
}

.ant-avatar {
  border: 1px solid #f0f0f0;
}
</style>
