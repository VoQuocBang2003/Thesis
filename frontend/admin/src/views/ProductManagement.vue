<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Product Management</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="actions-bar">
      <a-input-search
      v-model:value="searchQuery"
      placeholder="Search products"
      enter-button
      @search="handleSearch"
      @change="handleSearchChange"
      allow-clear
      style="max-width: 300px;"
/>
      <a-button type="primary" @click="showCreateModal">Add Product</a-button>
    </div>

    <a-table
      class="custom-pagination"
      :columns="columns"
      :dataSource="products"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Edit</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Are you sure you want to delete this product?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="handleDelete(record.id)"
          >
            <a>Delete</a>
          </a-popconfirm>
        </span>
        <img v-else-if="column.key === 'image'" :src="record.image || placeholderImage" alt="Image" style="width: 50px; height: 50px;" />
        <span v-else-if="column.key === 'price'">
          {{ formatCurrency(record.price) }}
        </span>
        <span v-else-if="column.key === 'cost_price'">
          {{ formatCurrency(record.cost_price || 0) }}
        </span>
        <span v-else-if="column.key === 'StockQuantity'">
          <a-tag :color="record.StockQuantity > 0 ? 'green' : 'red'">
            {{ record.StockQuantity > 0 ? `Còn hàng (${record.StockQuantity})` : 'Hết hàng' }}
          </a-tag>
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>

    <!-- Modal -->
    <a-modal
      v-model:visible="isModalVisible"
      title="Product"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="formData" :rules="rules" ref="productForm" layout="vertical">
        <a-form-item label="Title" name="title">
          <a-input v-model:value="formData.title" />
        </a-form-item>

        <a-form-item label="Image" name="image">
          <a-upload
            :customRequest="handleCustomRequest"
            :showUploadList="false"
          >
            <a-button>Click to Upload File</a-button>
          </a-upload>
          <div style="margin-top: 10px;">
            <a-input
              v-model:value="formData.image"
              placeholder="Or enter image URL (e.g., https://example.com/image.jpg)"
              style="margin-top: 10px;"
            />
          </div>
          <img v-if="formData.image" :src="formData.image" style="max-width: 100px; margin-top: 10px;" />
        </a-form-item>

        <a-form-item label="Category" name="categories_id">
          <a-select v-model:value="formData.categories_id" placeholder="Select a category">
            <a-select-option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Description" name="description">
          <a-textarea v-model:value="formData.description" rows="4" />
        </a-form-item>

        <a-form-item label="Price (Giá bán)" name="price">
          <a-input-number v-model:value="formData.price" style="width: 100%" :min="0" />
        </a-form-item>

        <a-form-item label="Cost Price (Giá nhập)" name="cost_price">
          <a-input-number v-model:value="formData.cost_price" style="width: 100%" :min="0" />
          <div style="margin-top: 4px; font-size: 12px; color: #666;">
            Giá nhập của sản phẩm (dùng để tính doanh thu)
          </div>
        </a-form-item>

        <a-form-item label="Stock Quantity" name="StockQuantity">
          <a-input-number v-model:value="formData.StockQuantity" style="width: 100%" @change="updateStockStatus" />
          <div v-if="formData.StockQuantity !== null && formData.StockQuantity !== undefined" style="margin-top: 8px;">
            <a-tag :color="formData.StockQuantity > 0 ? 'green' : 'red'" style="font-size: 14px; padding: 4px 12px;">
              <template v-if="formData.StockQuantity > 0">
                ✅ Còn hàng ({{ formData.StockQuantity }} sản phẩm)
              </template>
              <template v-else>
                ❌ Hết hàng
              </template>
            </a-tag>
          </div>
        </a-form-item>

        <a-form-item label="Status" name="status">
          <a-select v-model:value="formData.status" placeholder="Select status">
            <a-select-option value="Available">Available</a-select-option>
            <a-select-option value="Unavailable">Unavailable</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { getAllBooks, createBook, updateBook, deleteBook, searchBooks } from '@/apis/booksApi'
import { getAllCategories } from '@/apis/categoriesApi'
import { message } from 'ant-design-vue'

export default {
  name: 'ProductManagement',
  data() {
    return {
      products: [],
      categories: [],
      searchQuery: '',
      columns: [
        { title: 'Image', key: 'image' },
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Price (Giá bán)', dataIndex: 'price', key: 'price' },
        { title: 'Cost Price (Giá nhập)', dataIndex: 'cost_price', key: 'cost_price' },
        { title: 'Stock Quantity', dataIndex: 'StockQuantity', key: 'StockQuantity' },
        { title: 'Status', dataIndex: 'status', key: 'status' }, 
        { title: 'Actions', key: 'actions' },
      ],
      isModalVisible: false,
      isEditing: false,
      placeholderImage: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg',
      formData: {
        id: null,
        title: '',
        image: '',
        imageFile: null,
        categories_id: null,
        description: '',
        price: 0,
        cost_price: 0,
        StockQuantity: 0,
        status: '',
      },
      rules: {
        title: [{ required: true, message: 'Please enter the title!' }],
        categories_id: [{ required: true, message: 'Please select a category!' }],
        description: [{ required: true, message: 'Please enter the description!' }],
        price: [{ required: true, message: 'Please enter the price!' }],
        StockQuantity: [{ required: true, message: 'Please enter the stock quantity!' }],
        status: [{ required: true, message: 'Please select the status!' }],
      }
    }
  },
  async created() {
    this.fetchProducts()
    this.fetchCategories()
  },
  methods: {
    async fetchProducts() {
      try {
        const data = await getAllBooks()
        this.products = data
      } catch (error) {
        message.error(error.message || 'Error loading products!')
      }
    },
    async fetchCategories() {
      try {
        const data = await getAllCategories()
        this.categories = data
      } catch (error) {
        message.error(error.message || 'Error loading categories!')
      }
    },
    async handleSearch() {
      try {
        // If search query is empty, fetch all products
        if (!this.searchQuery || this.searchQuery.trim() === '') {
          await this.fetchProducts();
          return;
        }
        
        const data = await searchBooks(this.searchQuery.trim());
        this.products = data || [];
      } catch (error) {
        console.error('Search error:', error);
        message.error(error.response?.data?.message || error.message || 'Error searching products!');
        // On error, try to fetch all products as fallback
        try {
          await this.fetchProducts();
        } catch (fetchError) {
          console.error('Failed to fetch products:', fetchError);
        }
      }
    },
    handleSearchChange(e) {
      // When search input is cleared, fetch all products
      if (!e.target.value || e.target.value.trim() === '') {
        this.searchQuery = '';
        this.fetchProducts();
      }
    },
    showCreateModal() {
      this.isEditing = false
      this.formData = {
        id: null,
        title: '',
        image: '',
        imageFile: null,
        categories_id: null,
        description: '',
        price: 0,
        cost_price: 0,
        StockQuantity: 0,
        status: '',
      }
      this.isModalVisible = true
    },
    updateStockStatus() {
      // Auto-update status based on stock quantity
      if (this.formData.StockQuantity > 0) {
        this.formData.status = 'Available'
      } else {
        this.formData.status = 'Unavailable'
      }
    },
    showEditModal(record) {
      this.isEditing = true
      this.formData = { ...record, imageFile: null } // giữ nguyên image
      this.isModalVisible = true
    },
    async handleOk() {
      this.$refs.productForm.validate().then(async () => {
        try {
          // If the image field contains a data URI (base64) — possibly pasted —
          // convert it into a File so the backend stores it as an uploaded file.
          const isProbablyDataURI = (str) => {
            if (!str || typeof str !== 'string') return false;
            // allow cases where someone accidentally prefixed with host, e.g. 'http://127.0.0.1:3100data:...'
            return str.includes('data:') && str.includes('base64');
          };

          const dataURLtoFile = (dataurl, filename = 'pasted-image.png') => {
            // dataurl -> [mime, base64]
            const arr = dataurl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
          };

          // Normalize accidental prefix: extract substring starting at 'data:'
          if (!this.formData.imageFile && isProbablyDataURI(this.formData.image)) {
            const idx = this.formData.image.indexOf('data:');
            const dataPart = this.formData.image.substring(idx);
            try {
              this.formData.imageFile = dataURLtoFile(dataPart, 'pasted-image.png');
              // set a preview URL (optional)
              this.formData.image = URL.createObjectURL(this.formData.imageFile);
            } catch (convErr) {
              console.warn('Failed to convert data URI to file', convErr);
            }
          }

          // If there's a local file selected, send FormData (multipart)
          // Otherwise, send a plain JSON body (so backend will accept an image URL)
          let payload;
          if (this.formData.imageFile) {
            payload = new FormData();
            for (const key in this.formData) {
              if (key === 'imageFile') continue;
              const value = this.formData[key];
              if (value !== null && value !== undefined) {
                payload.append(key, value);
              }
            }
            payload.append('image', this.formData.imageFile);
          } else {
            // Plain object; ensure numeric fields are numbers
            payload = {
              title: this.formData.title,
              image: this.formData.image || '',
              categories_id: this.formData.categories_id,
              description: this.formData.description,
              price: this.formData.price,
              cost_price: this.formData.cost_price,
              StockQuantity: this.formData.StockQuantity,
              status: this.formData.status,
            };
          }

          if (this.isEditing) {
            await updateBook(this.formData.id, payload)
            message.success('Product updated successfully!')
          } else {
            await createBook(payload)
            message.success('Product added successfully!')
          }
          this.isModalVisible = false
          this.fetchProducts()
        } catch (error) {
          message.error(error.message || (error.response && error.response.data && error.response.data.message) || 'An error occurred!')
        }
      }).catch(() => {
        message.error('Please complete all required fields!')
      })
    },
    handleCancel() {
      this.isModalVisible = false
    },
    async handleDelete(id) {
      try {
        await deleteBook(id)
        message.success('Product deleted successfully!')
        this.fetchProducts()
      } catch (error) {
        message.error(error.message || 'An error occurred!')
      }
    },
    async handleCustomRequest({ file, onSuccess, onError }) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        message.error('Chỉ cho phép file ảnh (JPEG, PNG, JPG, WEBP)');
        onError();
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        message.error('Kích thước file không được vượt quá 5MB');
        onError();
        return;
      }
      
      this.formData.imageFile = file
      this.formData.image = URL.createObjectURL(file)
      onSuccess()
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
</style>
