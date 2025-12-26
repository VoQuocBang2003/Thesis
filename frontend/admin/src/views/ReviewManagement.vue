<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Review Management</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="actions-bar">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="Search reviews by username or book title"
        enter-button
        @search="handleSearch"
        style="max-width: 300px;"
      />
      <a-radio-group v-model:value="filterStatus" @change="handleFilterChange">
        <a-radio-button value="all">All</a-radio-button>
        <a-radio-button value="approved">Approved</a-radio-button>
        <a-radio-button value="pending">Pending</a-radio-button>
      </a-radio-group>
    </div>

    <a-table
      :columns="columns"
      :dataSource="filteredReviews"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'rating'">
          <a-rate :value="record.rating" disabled />
        </span>
        <span v-else-if="column.key === 'is_approved'">
          <a-tag :color="record.is_approved ? 'green' : 'orange'">
            {{ record.is_approved ? 'Approved' : 'Pending' }}
          </a-tag>
        </span>
        <span v-else-if="column.key === 'created_at'">
          {{ formatDate(record.created_at) }}
        </span>
        <span v-else-if="column.key === 'actions'">
          <a-space>
            <a-button
              v-if="!record.is_approved"
              type="primary"
              size="small"
              @click="handleApprove(record.id)"
            >
              Approve
            </a-button>
            <a-button
              v-if="record.is_approved"
              type="default"
              size="small"
              @click="handleReject(record.id)"
            >
              Reject
            </a-button>
            <a-popconfirm
              title="Are you sure you want to delete this review?"
              ok-text="Yes"
              cancel-text="No"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" danger size="small">Delete</a-button>
            </a-popconfirm>
          </a-space>
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>
  </div>
</template>

<script>
import { getAllReviews, approveReview, rejectReview, deleteReview } from '@/apis/reviewsApi';
import { message } from 'ant-design-vue';
import moment from 'moment';

export default {
  name: 'ReviewManagement',
  data() {
    return {
      reviews: [],
      filteredReviews: [],
      loading: false,
      searchQuery: '',
      filterStatus: 'all',
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'User', dataIndex: 'username', key: 'username' },
        { title: 'Product', dataIndex: 'book_title', key: 'book_title' },
        { title: 'Rating', key: 'rating', width: 150 },
        { title: 'Comment', dataIndex: 'comment', key: 'comment', ellipsis: true },
        { title: 'Status', key: 'is_approved', width: 120 },
        { title: 'Date', key: 'created_at', width: 180 },
        { title: 'Actions', key: 'actions', width: 200 },
      ],
    };
  },
  async created() {
    await this.fetchReviews();
  },
  methods: {
    async fetchReviews() {
      this.loading = true;
      try {
        const data = await getAllReviews();
        this.reviews = data;
        this.applyFilters();
      } catch (error) {
        message.error(error.message || 'Error loading reviews');
      } finally {
        this.loading = false;
      }
    },
    applyFilters() {
      let filtered = [...this.reviews];

      // Filter by status
      if (this.filterStatus === 'approved') {
        filtered = filtered.filter(r => r.is_approved === true || r.is_approved === 1);
      } else if (this.filterStatus === 'pending') {
        filtered = filtered.filter(r => !r.is_approved || r.is_approved === false || r.is_approved === 0);
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(r =>
          (r.username && r.username.toLowerCase().includes(query)) ||
          (r.book_title && r.book_title.toLowerCase().includes(query)) ||
          (r.comment && r.comment.toLowerCase().includes(query))
        );
      }

      this.filteredReviews = filtered;
    },
    handleSearch() {
      this.applyFilters();
    },
    handleFilterChange() {
      this.applyFilters();
    },
    async handleApprove(reviewId) {
      try {
        await approveReview(reviewId);
        message.success('Review approved successfully');
        await this.fetchReviews();
      } catch (error) {
        message.error(error.message || 'Error approving review');
      }
    },
    async handleReject(reviewId) {
      try {
        await rejectReview(reviewId);
        message.success('Review rejected successfully');
        await this.fetchReviews();
      } catch (error) {
        message.error(error.message || 'Error rejecting review');
      }
    },
    async handleDelete(reviewId) {
      try {
        await deleteReview(reviewId);
        message.success('Review deleted successfully');
        await this.fetchReviews();
      } catch (error) {
        message.error(error.message || 'Error deleting review');
      }
    },
    formatDate(date) {
      return moment(date).format('DD/MM/YYYY HH:mm');
    },
  },
};
</script>

<style scoped>
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}
</style>


