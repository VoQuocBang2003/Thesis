<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Trang chủ</a-breadcrumb-item>
      <a-breadcrumb-item>Quản lý danh mục</a-breadcrumb-item>
    </a-breadcrumb>
    <div class="actions-bar">
      <a-input-search
        placeholder="Tìm kiếm danh mục"
        enter-button
        @search="handleSearch"
        style="max-width: 300px;"
      />
      <a-button type="primary" @click="showCreateModal">Thêm danh mục</a-button>
    </div>
    <a-table
      :columns="columns"
      :dataSource="categories"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Sửa</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Bạn có chắc chắn muốn xóa danh mục này không?"
            ok-text="Có"
            cancel-text="Không"
            @confirm="handleDelete(record.id)"
          >
            <a>Xóa</a>
          </a-popconfirm>
        </span>
        <img v-else-if="column.key === 'image'" :src="record.image || placeholderImage" alt="Image" style="width: 50px; height: 50px;" />
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>
    <a-modal
      v-model:visible="isModalVisible"
      title="Danh mục"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="formData" :rules="rules" ref="categoryForm" layout="vertical">
        <a-form-item label="Tên danh mục" name="name" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="Mô tả" name="description" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.description" />
        </a-form-item>
        <a-form-item label="Hình ảnh" name="image" style="margin-bottom: 10px;">
          <a-upload
            name="file"
            :customRequest="handleCustomRequest"
            list-type="picture-card"
            :show-upload-list="false"
          >
            <div>
              <a-icon type="plus" />
              <div style="margin-top: 8px">Upload</div>
            </div>
          </a-upload>
          <img v-if="formData.image" :src="formData.image" alt="Image" style="width: 100px; margin-top: 8px;" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { getAllCategories, createCategory, updateCategory, deleteCategory, searchCategories } from '@/apis/categoriesApi';
import { uploadImage } from '@/apis/uploadApi';
import { message } from 'ant-design-vue';

export default {
  name: 'CategoryManagement',
  data() {
    return {
      categories: [],
      columns: [
        {
          title: 'Hình ảnh',
          key: 'image',
        },
        {
          title: 'Tên',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Mô tả',
          dataIndex: 'description',
          key: 'description',
        },
        {
          title: 'Hành động',
          key: 'actions',
        },
      ],
      isModalVisible: false,
      formData: {
        id: null,
        name: '',
        description: '',
        image: '',
      },
      isEditing: false,
      placeholderImage: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', 
      rules: {
        name: [{ required: true, message: 'Vui lòng nhập tên danh mục!' }],
        description: [{ required: true, message: 'Vui lòng nhập mô tả!' }],
        image: [{ required: true, message: 'Vui lòng tải lên hình ảnh!' }],
      },
    };
  },
  async created() {
    this.fetchCategories();
  },
  methods: {
    async fetchCategories() {
      try {
        const data = await getAllCategories();
        this.categories = data;
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi tải danh mục!');
      }
    },
    async handleSearch(query) {
      try {
        const data = await searchCategories(query);
        this.categories = data;
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi tìm kiếm danh mục!');
      }
    },
    showCreateModal() {
      this.isEditing = false;
      this.formData = { id: null, name: '', description: '', image: '' };
      this.isModalVisible = true;
    },
    showEditModal(record) {
      this.isEditing = true;
      this.formData = { ...record };
      this.isModalVisible = true;
    },
    async handleOk() {
      this.$refs.categoryForm.validate().then(async () => {
        try {
          if (this.isEditing) {
            await updateCategory(this.formData.id, { name: this.formData.name, description: this.formData.description, image: this.formData.image });
            message.success('Cập nhật danh mục thành công!');
          } else {
            await createCategory({ name: this.formData.name, description: this.formData.description, image: this.formData.image });
            message.success('Thêm danh mục thành công!');
          }
          this.isModalVisible = false;
          this.fetchCategories();
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
        await deleteCategory(id);
        message.success('Xóa danh mục thành công!');
        this.fetchCategories();
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra!');
      }
    },
    async handleCustomRequest({ file, onSuccess, onError }) {
      try {
        const response = await uploadImage(file);
        this.formData.image = response.data.url;
        onSuccess(response, file);
        message.success(`${file.name} file uploaded successfully`);
      } catch (error) {
        onError(error);
        message.error(`${file.name} file upload failed.`);
      }
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