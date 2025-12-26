<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Order Management</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="actions-bar">
      <a-input-search
        placeholder="Search orders"
        enter-button
        @search="handleSearch"
        style="max-width: 300px"
      />
    </div>

    <a-table
      class="custom-pagination"
      :columns="columns"
      :dataSource="orders"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions' && record.status !== 'Cancelled'">
          <a @click="showEditModal(record)" style="margin-right: 8px">Update Status</a>
          <a @click="showViewModal(record)" style="margin-right: 8px">View Details</a>
        </span>
        <span v-else-if="column.key === 'order_date'">
          {{ formatDate(record.order_date) }}
        </span>
        <span v-else-if="column.key === 'total_price'">
          {{ formatCurrency(record.total_price) }}
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>

    <!-- Modal cập nhật trạng thái -->
    <a-modal
      v-model:visible="isModalVisible"
      title="Update Order Status"
      @ok="updateOrderStatus"
      @cancel="handleCancel"
      width="600px"
    >
      <a-form :model="formData" ref="orderForm" layout="vertical">
        <a-form-item label="Status" name="status" style="margin-bottom: 10px">
          <a-select v-model:value="formData.status" placeholder="Select status">
            <a-select-option value="pending">Pending</a-select-option>
            <a-select-option value="confirmed">Confirmed</a-select-option>
            <a-select-option value="shipping">Shipping</a-select-option>
            <a-select-option value="delivered">Delivered</a-select-option>
            <a-select-option value="canceled">Canceled</a-select-option>
            <a-select-option value="rejected">Rejected</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Modal xem chi tiết -->
    <a-modal
      v-model:visible="isViewModalVisible"
      title="Order Details"
      @ok="handleViewCancel"
      @cancel="handleViewCancel"
      width="800px"
    >
      <div v-if="selectedOrder">
        <a-descriptions :column="2" bordered style="margin-bottom: 24px">
          <a-descriptions-item label="Order ID">#{{ selectedOrder.id }}</a-descriptions-item>
          <a-descriptions-item label="Order Date">{{ formatDate(selectedOrder.order_date) }}</a-descriptions-item>
          <a-descriptions-item label="Status">
            <a-tag :color="getStatusColor(selectedOrder.status)">{{ selectedOrder.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Quantity">{{ selectedOrder.quantity }}</a-descriptions-item>
          <a-descriptions-item v-if="selectedOrder.voucher" label="Voucher Code" :span="2">
            <a-tag color="green">
              {{ selectedOrder.voucher.code }} - {{ selectedOrder.voucher.name }}
            </a-tag>
            <span style="margin-left: 8px; color: #52c41a; font-weight: bold">
              -{{ formatCurrency(selectedOrder.voucher.discount_amount || selectedOrder.discount_amount || 0) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="Original Amount" v-if="selectedOrder.voucher">
            {{ formatCurrency((selectedOrder.total_price || 0) + (selectedOrder.voucher.discount_amount || selectedOrder.discount_amount || 0)) }}
          </a-descriptions-item>
          <a-descriptions-item label="Total Price" :span="selectedOrder.voucher ? 1 : 2">
            <span :style="{ fontWeight: 'bold', color: selectedOrder.voucher ? '#e74c3c' : 'inherit', fontSize: '1.1em' }">
              {{ formatCurrency(selectedOrder.total_price) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="Shipping Address" :span="2">
            {{ selectedOrder.shipping_address || 'N/A' }}
          </a-descriptions-item>
        </a-descriptions>

        <h4 style="margin-bottom: 16px">Products in Order:</h4>
      <div v-if="selectedOrderBooks.length">
          <div v-for="book in selectedOrderBooks" :key="book.id" class="book-detail" style="display: flex; margin-bottom: 20px; padding: 16px; border: 1px solid #e8e8e8; border-radius: 8px">
          <img
            :src="getImageUrl(book.image)"
            alt="Book cover"
            class="book-image"
              style="width: 150px; height: auto; border-radius: 8px; margin-right: 16px; object-fit: cover"
              @error="handleImageError"
          />
            <div class="book-info" style="flex: 1">
              <h3 style="margin-top: 0">{{ book.title }}</h3>
              <p><strong>Price:</strong> {{ formatCurrency(book.price) }}</p>
              <p><strong>Quantity:</strong> {{ book.quantity }}</p>
              <p><strong>Subtotal:</strong> {{ formatCurrency(book.price * book.quantity) }}</p>
              <p v-if="book.description"><strong>Description:</strong> {{ book.description }}</p>
            </div>
          </div>
        </div>
        <div v-else>
          <p>No products information available.</p>
        </div>
      </div>
      <div v-else>
        <p>No information to display.</p>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { getAllOrders, searchOrders, updateOrderStatus } from '@/apis/ordersApi'
import { message, Descriptions, Tag } from 'ant-design-vue'
import moment from 'moment'

export default {
  name: 'OrderManagement',
  components: {
    'a-descriptions': Descriptions,
    'a-descriptions-item': Descriptions.Item,
    'a-tag': Tag,
  },
  data() {
    return {
      orders: [],
      columns: [
        { title: 'Username', dataIndex: 'username', key: 'username' },
        { title: 'Order Date', dataIndex: 'order_date', key: 'order_date' },
        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
        { title: 'Total Price', dataIndex: 'total_price', key: 'total_price' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        { title: 'Actions', key: 'actions' }
      ],
      isModalVisible: false,
      isViewModalVisible: false,
      formData: {
        id: null,
        status: ''
      },
      selectedOrder: null,
      selectedOrderBooks: []
    }
  },
  async created() {
    this.fetchOrders()
  },
  methods: {
    async fetchOrders() {
      try {
        const data = await getAllOrders()
        this.orders = data
      } catch (error) {
        message.error(error.message || 'Error loading orders!')
      }
    },

    async handleSearch(query) {
      try {
        // Truyền đúng query string cho searchOrders, backend sẽ xử lý theo controller
        const data = await searchOrders(query);
        this.orders = data;
      } catch (error) {
        message.error(error.message || 'Error searching orders!');
      }
    },

    showEditModal(record) {
      this.formData = { id: record.id, status: record.status }
      this.isModalVisible = true
    },

    async updateOrderStatus() {
      if (!this.formData.id || !this.formData.status) {
        message.warning('Please select a valid status!')
        return
      }

      try {
        await updateOrderStatus(this.formData.id, this.formData.status)
        message.success('Order status updated successfully!')
        this.isModalVisible = false
        this.fetchOrders()
      } catch (err) {
        message.error(err.message || 'Failed to update status.')
      }
    },

    handleCancel() {
      this.isModalVisible = false
    },

    async showViewModal(record) {
      this.selectedOrder = record;
      try {
        // Backend đã trả về books đầy đủ, không cần gọi getBookById
        const books = [];
        const bookObjs = Array.isArray(record.books) ? record.books : [];
        for (const item of bookObjs) {
          if (item && item.title && item.price) {
            // Sách đã có thông tin đầy đủ từ backend
            books.push(item);
          }
        }
        this.selectedOrderBooks = books;
      } catch (err) {
        console.error('Lỗi khi hiển thị chi tiết đơn hàng:', err);
        this.selectedOrderBooks = [];
      }
      this.isViewModalVisible = true;
    },

    handleViewCancel() {
      this.isViewModalVisible = false;
      this.selectedOrder = null;
    },

    getImageUrl(imageUrl) {
      if (!imageUrl) {
        return 'https://via.placeholder.com/150?text=No+Image';
      }
      // Nếu ảnh đã là URL đầy đủ
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      // Nếu ảnh là đường dẫn tương đối từ backend
      return imageUrl;
    },

    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/150?text=No+Image';
    },

    getStatusColor(status) {
      const colors = {
        pending: 'orange',
        confirmed: 'blue',
        shipping: 'purple',
        delivered: 'green',
        completed: 'green',
        canceled: 'red',
        cancelled: 'red',
      };
      return colors[status?.toLowerCase()] || 'default';
    },

    formatDate(date) {
      return moment(date).format('DD/MM/YYYY')
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value)
    }
  }
}
</script>

<style scoped>
::v-deep(.custom-pagination .ant-pagination) {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
  border: 1px solid #ffffff;
  border-radius: 6px;
  padding: 4px 8px;
}
::v-deep(.custom-pagination .ant-pagination-item a) {
  color: white !important;
}
::v-deep(.custom-pagination .ant-pagination-item),
::v-deep(.custom-pagination .ant-pagination-prev),
::v-deep(.custom-pagination .ant-pagination-next) {
  background-color: transparent !important;
  border-color: white;
}
::v-deep(.custom-pagination .ant-pagination-item-active) {
  background-color: white !important;
  border-color: white !important;
}
::v-deep(.custom-pagination .ant-pagination-item-active a) {
  color: black !important;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.book-detail {
  display: flex;
  margin-bottom: 16px;
}
.book-image {
  width: 100px;
  height: auto;
  margin-right: 16px;
}
.book-info {
  flex: 1;
}
</style>
