<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Voucher Management</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="actions-bar">
      <a-button type="primary" @click="showCreateModal">Add Voucher</a-button>
    </div>

    <a-table
      class="custom-pagination"
      :columns="columns"
      :dataSource="vouchers"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Edit</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Are you sure you want to delete this voucher?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="handleDelete(record.id)"
          >
            <a>Delete</a>
          </a-popconfirm>
        </span>
        <a-tag v-else-if="column.key === 'type'" :color="record.type === 'percentage' ? 'blue' : 'green'">
          {{ record.type === 'percentage' ? 'Percentage' : 'Fixed' }}
        </a-tag>
        <span v-else-if="column.key === 'value'">
          {{ record.type === 'percentage' ? `${record.value}%` : `${formatCurrency(record.value)} VNĐ` }}
        </span>
        <a-tag v-else-if="column.key === 'status'" :color="record.is_active ? 'green' : 'red'">
          {{ record.is_active ? 'Active' : 'Inactive' }}
        </a-tag>
        <span v-else-if="column.key === 'usage'">
          {{ record.used_count }} / {{ record.usage_limit || '∞' }}
        </span>
        <span v-else-if="column.key === 'applicable_products'">
          <a-tag v-if="getApplicableProducts(record).length > 0" color="blue">
            {{ getApplicableProducts(record).length }} sản phẩm
          </a-tag>
          <a-tag v-else color="default">Tất cả</a-tag>
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>

    <!-- Modal -->
    <a-modal
      v-model:visible="isModalVisible"
      :title="isEditing ? 'Edit Voucher' : 'Add Voucher'"
      @ok="handleOk"
      @cancel="handleCancel"
      width="800px"
    >
      <a-form :model="formData" :rules="rules" ref="voucherForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Code" name="code">
              <a-input v-model:value="formData.code" placeholder="VOUCHER123" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Name" name="name">
              <a-input v-model:value="formData.name" placeholder="Voucher name" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Description" name="description">
          <a-textarea v-model:value="formData.description" rows="3" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="Type" name="type">
              <a-select v-model:value="formData.type" placeholder="Select type">
                <a-select-option value="percentage">Percentage</a-select-option>
                <a-select-option value="fixed">Fixed Amount</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="Value" name="value">
              <a-input-number
                v-model:value="formData.value"
                :min="0"
                :max="formData.type === 'percentage' ? 100 : undefined"
                style="width: 100%"
                :placeholder="formData.type === 'percentage' ? '0-100' : 'Amount'"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8" v-if="formData.type === 'percentage'">
            <a-form-item label="Max Discount" name="max_discount">
              <a-input-number
                v-model:value="formData.max_discount"
                :min="0"
                style="width: 100%"
                placeholder="Max discount (VNĐ)"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Min Order Amount" name="min_order_amount">
              <a-input-number
                v-model:value="formData.min_order_amount"
                :min="0"
                style="width: 100%"
                placeholder="Minimum order amount"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Usage Limit" name="usage_limit">
              <a-input-number
                v-model:value="formData.usage_limit"
                :min="0"
                style="width: 100%"
                placeholder="Total usage limit (leave empty for unlimited)"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="User Limit" name="user_limit">
              <a-input-number
                v-model:value="formData.user_limit"
                :min="1"
                style="width: 100%"
                placeholder="Usage per user"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Status" name="is_active">
              <a-select v-model:value="formData.is_active" placeholder="Select status">
                <a-select-option :value="true">Active</a-select-option>
                <a-select-option :value="false">Inactive</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Start Date" name="start_date">
              <a-date-picker
                v-model:value="formData.start_date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="End Date" name="end_date">
              <a-date-picker
                v-model:value="formData.end_date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Áp dụng cho sản phẩm cụ thể" name="applicable_products">
          <a-select
            v-model:value="formData.applicable_products"
            mode="multiple"
            :placeholder="'Chọn sản phẩm (để trống = áp dụng cho tất cả)'"
            style="width: 100%"
            :loading="loadingProducts"
            show-search
            :filter-option="filterProductOption"
            :options="productOptions"
            option-label-prop="label"
          >
            <template #option="{ value, label }">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ label }}</span>
                <span style="color: #999; font-size: 12px">{{ getProductPrice(value) }}</span>
              </div>
            </template>
          </a-select>
          <div style="margin-top: 8px; color: #666; font-size: 12px">
            💡 Để trống để áp dụng cho tất cả sản phẩm. Chọn sản phẩm cụ thể để voucher chỉ áp dụng cho các sản phẩm đó.
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { getAllVouchers, createVoucher, updateVoucher, deleteVoucher } from '@/apis/vouchersApi';
import { getAllBooks } from '@/apis/booksApi';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

export default {
  name: 'VoucherManagement',
  data() {
    return {
      vouchers: [],
      products: [],
      loadingProducts: false,
      productOptions: [],
      columns: [
        { title: 'Code', dataIndex: 'code', key: 'code' },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', key: 'type' },
        { title: 'Value', key: 'value' },
        { title: 'Min Order', dataIndex: 'min_order_amount', key: 'min_order_amount' },
        { title: 'Sản phẩm', key: 'applicable_products' },
        { title: 'Usage', key: 'usage' },
        { title: 'Start Date', dataIndex: 'start_date', key: 'start_date' },
        { title: 'End Date', dataIndex: 'end_date', key: 'end_date' },
        { title: 'Status', key: 'status' },
        { title: 'Actions', key: 'actions' },
      ],
      isModalVisible: false,
      isEditing: false,
      formData: {
        id: null,
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        min_order_amount: 0,
        max_discount: null,
        usage_limit: null,
        user_limit: 1,
        start_date: null,
        end_date: null,
        is_active: true,
        applicable_products: [],
      },
      rules: {
        code: [{ required: true, message: 'Please enter the code!' }],
        name: [{ required: true, message: 'Please enter the name!' }],
        type: [{ required: true, message: 'Please select the type!' }],
        value: [{ required: true, message: 'Please enter the value!' }],
        start_date: [{ required: true, message: 'Please select the start date!' }],
        end_date: [{ required: true, message: 'Please select the end date!' }],
      }
    };
  },
  async created() {
    this.fetchVouchers();
    this.fetchProducts();
  },
  methods: {
    async fetchVouchers() {
      try {
        const data = await getAllVouchers();
        this.vouchers = data;
      } catch (error) {
        message.error(error.message || 'Error loading vouchers!');
      }
    },
    async fetchProducts() {
      this.loadingProducts = true;
      try {
        const books = await getAllBooks();
        this.products = books;
        this.productOptions = books.map(book => ({
          value: book.id,
          label: book.title,
          price: book.price
        }));
      } catch (error) {
        console.error('Error loading products:', error);
        message.warning('Could not load products list');
      } finally {
        this.loadingProducts = false;
      }
    },
    filterProductOption(input, option) {
      return option.label.toLowerCase().includes(input.toLowerCase());
    },
    getProductPrice(productId) {
      const product = this.products.find(p => p.id === productId);
      return product ? this.formatCurrency(product.price) : '';
    },
    getApplicableProducts(record) {
      if (!record.applicable_products) return [];
      try {
        const parsed = typeof record.applicable_products === 'string' 
          ? JSON.parse(record.applicable_products) 
          : record.applicable_products;
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },
    showCreateModal() {
      this.isEditing = false;
      this.formData = {
        id: null,
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        min_order_amount: 0,
        max_discount: null,
        usage_limit: null,
        user_limit: 1,
        start_date: null,
        end_date: null,
        is_active: true,
        applicable_products: [],
      };
      this.isModalVisible = true;
    },
    showEditModal(record) {
      this.isEditing = true;
      
      // Parse applicable_products nếu có
      let applicableProducts = [];
      if (record.applicable_products) {
        try {
          const parsed = typeof record.applicable_products === 'string' 
            ? JSON.parse(record.applicable_products) 
            : record.applicable_products;
          if (Array.isArray(parsed)) {
            applicableProducts = parsed.map(id => parseInt(id)).filter(id => !isNaN(id));
          }
        } catch (e) {
          console.warn('Could not parse applicable_products:', e);
        }
      }

      this.formData = {
        ...record,
        start_date: record.start_date ? dayjs(record.start_date) : null,
        end_date: record.end_date ? dayjs(record.end_date) : null,
        applicable_products: applicableProducts,
      };
      this.isModalVisible = true;
    },
    async handleOk() {
      this.$refs.voucherForm.validate().then(async () => {
        try {
          const submitData = {
            ...this.formData,
            start_date: dayjs(this.formData.start_date).format('YYYY-MM-DD'),
            end_date: dayjs(this.formData.end_date).format('YYYY-MM-DD'),
          };

          if (this.isEditing) {
            await updateVoucher(this.formData.id, submitData);
            message.success('Voucher updated successfully!');
          } else {
            await createVoucher(submitData);
            message.success('Voucher created successfully!');
          }
          this.isModalVisible = false;
          this.fetchVouchers();
        } catch (error) {
          message.error(error.message || 'An error occurred!');
        }
      }).catch(() => {
        message.error('Please complete all required fields!');
      });
    },
    handleCancel() {
      this.isModalVisible = false;
    },
    async handleDelete(id) {
      try {
        await deleteVoucher(id);
        message.success('Voucher deleted successfully!');
        this.fetchVouchers();
      } catch (error) {
        message.error(error.message || 'An error occurred!');
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    }
  }
};
</script>

<style scoped>
.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
::v-deep(.custom-pagination .ant-pagination) {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
  border: 1px solid #ffffff;
  border-radius: 6px;
  padding: 4px 8px;
}
</style>

