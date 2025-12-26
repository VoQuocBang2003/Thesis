<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Trang chủ</a-breadcrumb-item>
      <a-breadcrumb-item>Quản lý người dùng</a-breadcrumb-item>
    </a-breadcrumb>
    <div class="actions-bar">
      <a-input-search
        placeholder="Tìm kiếm người dùng"
        enter-button
        @search="handleSearch"
        style="max-width: 300px;"
      />
      <a-button type="primary" @click="showCreateModal">Thêm người dùng</a-button>
    </div>
    <a-table
      :columns="columns"
      :dataSource="users"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Sửa</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này không?"
            ok-text="Có"
            cancel-text="Không"
            @confirm="handleDelete(record.id)"
          >
            <a>Xóa</a>
          </a-popconfirm>
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>
    <a-modal
      v-model:visible="isModalVisible"
      title="Người dùng"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="formData" :rules="rules" ref="userForm" layout="vertical">
        <a-form-item label="Email" name="email" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.email" />
        </a-form-item>
        <a-form-item label="Số điện thoại" name="phone" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.phone" />
        </a-form-item>
        <a-form-item label="Tên người dùng" name="username" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.username" />
        </a-form-item>
        <a-form-item label="Mật khẩu" name="password" style="margin-bottom: 10px;">
          <a-input type="password" v-model:value="formData.password" />
        </a-form-item>
        <a-form-item label="Vai trò" name="role" style="margin-bottom: 10px;">
          <a-select v-model:value="formData.role" placeholder="Chọn vai trò">
            <a-select-option value="isClient">Khách hàng</a-select-option>
            <a-select-option value="isAdmin">Quản trị viên</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Trạng thái" name="status" style="margin-bottom: 10px;">
          <a-select v-model:value="formData.status" placeholder="Chọn trạng thái">
            <a-select-option value="active">Hoạt động</a-select-option>
            <a-select-option value="inactive">Không hoạt động</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { getAllUsers, createUser, updateUser, deleteUser, searchUserByEmail } from '@/apis/userApi';
import { message } from 'ant-design-vue';

export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      columns: [
        {
          title: 'Email',
          dataIndex: 'email',
          key: 'email',
        },
        {
          title: 'Số điện thoại',
          dataIndex: 'phone',
          key: 'phone',
        },
        {
          title: 'Tên người dùng',
          dataIndex: 'username',
          key: 'username',
        },
        {
          title: 'Vai trò',
          dataIndex: 'role',
          key: 'role',
        },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          key: 'status',
        },
        {
          title: 'Hành động',
          key: 'actions',
        },
      ],
      isModalVisible: false,
      formData: {
        id: null,
        email: '',
        phone: '',
        username: '',
        password: '',
        role: '',
        status: '',
      },
      isEditing: false,
      rules: {
        email: [{ required: true, message: 'Vui lòng nhập email!' }],
        phone: [{ required: true, message: 'Vui lòng nhập số điện thoại!' }],
        username: [{ required: true, message: 'Vui lòng nhập tên người dùng!' }],
        password: [{ required: true, message: 'Vui lòng nhập mật khẩu!' }],
        role: [{ required: true, message: 'Vui lòng chọn vai trò!' }],
        status: [{ required: true, message: 'Vui lòng chọn trạng thái!' }],
      },
    };
  },
  async created() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try {
        const data = await getAllUsers();
        this.users = data;
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi tải người dùng!');
      }
    },
    async handleSearch(query) {
      try {
        const data = await searchUserByEmail(query);
        this.users = data;
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi tìm kiếm người dùng!');
      }
    },
    showCreateModal() {
      this.isEditing = false;
      this.formData = {
        id: null,
        email: '',
        phone: '',
        username: '',
        password: '',
        role: '',
        status: '',
      };
      this.isModalVisible = true;
    },
    showEditModal(record) {
      this.isEditing = true;
      this.formData = { ...record, password: '' }; 
      this.isModalVisible = true;
    },
    async handleOk() {
      this.$refs.userForm.validate().then(async () => {
        try {
          if (this.isEditing) {
            await updateUser(this.formData.id, this.formData);
            message.success('Cập nhật người dùng thành công!');
          } else {
            await createUser(this.formData);
            message.success('Thêm người dùng thành công!');
          }
          this.isModalVisible = false;
          this.fetchUsers();
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
        await deleteUser(id);
        message.success('Xóa người dùng thành công!');
        this.fetchUsers();
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra!');
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