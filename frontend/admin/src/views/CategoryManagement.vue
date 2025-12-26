<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Category Management</a-breadcrumb-item>
    </a-breadcrumb>
    <div class="actions-bar">
      <a-input-search
        placeholder="Search category"
        enter-button
        @search="handleSearch"
        style="max-width: 300px;"
      />
      <a-button type="primary" @click="showCreateModal">Add Category</a-button>
    </div>
    <a-table
      :columns="columns"
      :dataSource="categories"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Edit</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Are you sure you want to delete this category?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="handleDelete(record.id)"
          >
            <a>Delete</a>
          </a-popconfirm>
        </span>
        <img v-else-if="column.key === 'image'" :src="record.image || placeholderImage" alt="Image" style="width: 50px; height: 50px;" />
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>
    <a-modal
      v-model:visible="isModalVisible"
      title="Category"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="formData" :rules="rules" ref="categoryForm" layout="vertical">
        <a-form-item label="Category Name" name="name" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="Description" name="description" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.description" />
        </a-form-item>
        <a-form-item label="Image" name="image" style="margin-bottom: 10px;">
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
        { title: 'Image', key: 'image' },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Actions', key: 'actions' },
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
        name: [{ required: true, message: 'Please enter the category name!' }],
        description: [{ required: true, message: 'Please enter the description!' }],
        image: [{ required: true, message: 'Please upload an image!' }],
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
        message.error(error.message || 'An error occurred while loading categories!');
      }
    },
    async handleSearch(query) {
      try {
        const data = await searchCategories(query);
        this.categories = data;
      } catch (error) {
        message.error(error.message || 'An error occurred while searching categories!');
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
            await updateCategory(this.formData.id, {
              name: this.formData.name,
              description: this.formData.description,
              image: this.formData.image,
            });
            message.success('Category updated successfully!');
          } else {
            await createCategory({
              name: this.formData.name,
              description: this.formData.description,
              image: this.formData.image,
            });
            message.success('Category added successfully!');
          }
          this.isModalVisible = false;
          this.fetchCategories();
        } catch (error) {
          message.error(error.message || 'An error occurred!');
        }
      }).catch(() => {
        message.error('Please fill in all required information!');
      });
    },
    handleCancel() {
      this.isModalVisible = false;
    },
    async handleDelete(id) {
      try {
        await deleteCategory(id);
        message.success('Category deleted successfully!');
        this.fetchCategories();
      } catch (error) {
        message.error(error.message || 'An error occurred!');
      }
    },
    async handleCustomRequest({ file, onSuccess, onError }) {
      try {
        const response = await uploadImage(file);
        this.formData.image = response.data.url;
        onSuccess(response, file);
        message.success(`${file.name} uploaded successfully`);
      } catch (error) {
        onError(error);
        message.error(`${file.name} upload failed.`);
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