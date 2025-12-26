<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Trang chủ</a-breadcrumb-item>
      <a-breadcrumb-item>Quản lý sản phẩm</a-breadcrumb-item>
    </a-breadcrumb>
    <div class="actions-bar">
      <a-input-search
        placeholder="Tìm kiếm sản phẩm"
        enter-button
        @search="handleSearch"
        style="max-width: 300px;"
      />
      <a-button type="primary" @click="showCreateModal">Thêm sản phẩm</a-button>
    </div>

    <a-table
      :columns="columns"
      :dataSource="products"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Sửa</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Bạn có chắc chắn muốn xóa sản phẩm này không?"
            ok-text="Có"
            cancel-text="Không"
            @confirm="handleDelete(record.id)"
          >
            <a>Xóa</a>
          </a-popconfirm>
        </span>
        <img
          v-else-if="column.key === 'image'"
          :src="record.image ? '/uploads/' + record.image : placeholderImage"
          alt="Image"
          style="width: 50px; height: 50px;"
        />
        <span v-else-if="column.key === 'price'">
          {{ formatCurrency(record.price) }}
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>

    <a-modal
      v-model:visible="isModalVisible"
      title="Sản phẩm"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="formData" :rules="rules" ref="productForm" layout="vertical">
        <a-form-item label="Tiêu đề" name="title"><a-input v-model:value="formData.title" /></a-form-item>
        <a-form-item label="Tác giả" name="author"><a-input v-model:value="formData.author" /></a-form-item>
        <a-form-item label="Nhà xuất bản" name="publisher"><a-input v-model:value="formData.publisher" /></a-form-item>
        <a-form-item label="Năm xuất bản" name="publicationYear">
          <a-input-number v-model:value="formData.publicationYear" style="width: 100%;" />
        </a-form-item>
        <a-form-item label="Thể loại" name="genre"><a-input v-model:value="formData.genre" /></a-form-item>
        <a-form-item label="Ngôn ngữ" name="language"><a-input v-model:value="formData.language" /></a-form-item>

        <!-- Upload ảnh -->
        <a-form-item label="Hình ảnh" name="image">
          <a-upload
            :show-upload-list="false"
            :before-upload="handleBeforeUpload"
            accept="image/*"
          >
            <div>
              <a-icon type="plus" />
              <div style="margin-top: 8px">Upload</div>
            </div>
          </a-upload>
          <img v-if="formData.image" :src="formData.image" alt="Preview" style="width: 100px; margin-top: 8px;" />
        </a-form-item>

        <a-form-item label="Danh mục" name="categories_id">
          <a-select v-model:value="formData.categories_id" placeholder="Chọn danh mục">
            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Mô tả" name="description"><a-textarea v-model:value="formData.description" /></a-form-item>
        <a-form-item label="Giá" name="price"><a-input-number v-model:value="formData.price" style="width: 100%;" /></a-form-item>
        <a-form-item label="Số lượng tồn kho" name="StockQuantity"><a-input-number v-model:value="formData.StockQuantity" style="width: 100%;" /></a-form-item>
        <a-form-item label="Trạng thái" name="Status">
          <a-select v-model:value="formData.Status" placeholder="Chọn trạng thái">
            <a-select-option value="Còn hàng">Còn hàng</a-select-option>
            <a-select-option value="Hết hàng">Hết hàng</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { getAllBooks, createBook, updateBook, deleteBook, searchBooks } from '@/apis/booksApi';
import { getAllCategories } from '@/apis/categoriesApi';
import { message } from 'ant-design-vue';
import _ from 'lodash';

export default {
  name: 'ProductManagement',
  data() {
    return {
      products: [],
      categories: [],
      isModalVisible: false,
      isEditing: false,
      placeholderImage: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg',
      formData: {
        id: null,
        title: '',
        author: '',
        publisher: '',
        publicationYear: 0,
        genre: '',
        language: '',
        image: '',       // dùng để preview ảnh
        imageFile: null, // file thực tế
        categories_id: null,
        description: '',
        price: 0,
        StockQuantity: 0,
        Status: '',
      },
      columns: [
        { title: 'Hình ảnh', key: 'image' },
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Tác giả', dataIndex: 'author', key: 'author' },
        { title: 'Nhà xuất bản', dataIndex: 'publisher', key: 'publisher' },
        { title: 'Năm', dataIndex: 'publicationYear', key: 'publicationYear' },
        { title: 'Thể loại', dataIndex: 'genre', key: 'genre' },
        { title: 'Ngôn ngữ', dataIndex: 'language', key: 'language' },
        { title: 'Giá', dataIndex: 'price', key: 'price' },
        { title: 'Số lượng tồn kho', dataIndex: 'StockQuantity', key: 'StockQuantity' },
        { title: 'Trạng thái', dataIndex: 'Status', key: 'Status' },
        { title: 'Hành động', key: 'actions' },
      ],
      rules: {
        title: [{ required: true, message: 'Vui lòng nhập tiêu đề!' }],
        author: [{ required: true, message: 'Vui lòng nhập tác giả!' }],
        publisher: [{ required: true, message: 'Vui lòng nhập nhà xuất bản!' }],
        publicationYear: [{ required: true, message: 'Vui lòng nhập năm xuất bản!' }],
        genre: [{ required: true, message: 'Vui lòng nhập thể loại!' }],
        language: [{ required: true, message: 'Vui lòng nhập ngôn ngữ!' }],
        categories_id: [{ required: true, message: 'Vui lòng chọn danh mục!' }],
        description: [{ required: true, message: 'Vui lòng nhập mô tả!' }],
        price: [{ required: true, message: 'Vui lòng nhập giá!' }],
        StockQuantity: [{ required: true, message: 'Vui lòng nhập số lượng tồn kho!' }],
        Status: [{ required: true, message: 'Vui lòng chọn trạng thái!' }],
      }
    };
  },
  async created() {
    this.fetchProducts();
    this.fetchCategories();
  },
  methods: {
    async fetchProducts() {
      try {
        const data = await getAllBooks();
        this.products = data;
      } catch (error) {
        message.error(error.message || 'Lỗi khi tải danh sách sản phẩm');
      }
    },
    async fetchCategories() {
      try {
        const data = await getAllCategories();
        this.categories = data;
      } catch (error) {
        message.error(error.message || 'Lỗi khi tải danh mục');
      }
    },
    async handleSearch(query) {
      try {
        const data = await searchBooks(query);
        this.products = data;
      } catch (error) {
        message.error(error.message || 'Lỗi khi tìm kiếm');
      }
    },
    showCreateModal() {
      this.isEditing = false;
      this.formData = {
        id: null,
        title: '',
        author: '',
        publisher: '',
        publicationYear: 0,
        genre: '',
        language: '',
        image: '',
        imageFile: null,
        categories_id: null,
        description: '',
        price: 0,
        StockQuantity: 0,
        Status: '',
      };
      this.isModalVisible = true;
    },
    showEditModal(record) {
      this.isEditing = true;
      this.formData = {
        ...record,
        image: record.image ? '/uploads/' + record.image : '',
        imageFile: null
      };
      this.isModalVisible = true;
    },
    async handleOk() {
      this.$refs.productForm.validate().then(async () => {
        try {
          const form = new FormData();
          for (const key in this.formData) {
            if (key === 'imageFile' && this.formData.imageFile) {
              form.append('image', this.formData.imageFile);
            } else if (key !== 'imageFile') {
              form.append(key, this.formData[key]);
            }
          }

          if (this.isEditing) {
            await updateBook(this.formData.id, form);
            message.success('Cập nhật sản phẩm thành công!');
          } else {
            await createBook(form);
            message.success('Thêm sản phẩm thành công!');
          }

          this.isModalVisible = false;
          this.fetchProducts();
        } catch (error) {
          message.error(error.message || 'Có lỗi xảy ra!');
        }
      }).catch(() => {
        message.error('Vui lòng điền đầy đủ thông tin!');
      });
    },
    handleCancel() {
      this.isModalVisible = false;
    },
    async handleDelete(id) {
      try {
        await deleteBook(id);
        message.success('Xóa sản phẩm thành công!');
        this.fetchProducts();
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi xóa');
      }
    },
    handleBeforeUpload(file) {
      this.formData.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.formData.image = e.target.result;
      };
      reader.readAsDataURL(file);
      return false;
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },
  },
};
</script>

<style scoped>
.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
