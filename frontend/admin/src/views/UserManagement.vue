<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home page</a-breadcrumb-item>
      <a-breadcrumb-item>User Management</a-breadcrumb-item>
    </a-breadcrumb>
    <div class="actions-bar">
      <a-input-search
        placeholder="Search for user"
        enter-button
        @search="handleSearch"
        style="max-width: 300px;"
      />
      <a-button type="primary" @click="showCreateModal">Add user</a-button>
    </div>
    <a-table
      :columns="columns"
      :dataSource="users"
      :pagination="{ pageSize: 10 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'actions'">
          <a @click="showEditModal(record)">Edit</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Are you sure you want to delete this user?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="handleDelete(record.id)"
          >
            <a>Delete</a>
          </a-popconfirm>
        </span>
        <span v-else>{{ record[column.dataIndex] || '-' }}</span>
      </template>
    </a-table>
    <a-modal
      v-model:visible="isModalVisible"
      title="User"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="formData" :rules="rules" ref="userForm" layout="vertical">
        <a-form-item label="Email" name="email" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.email" />
        </a-form-item>
        <a-form-item label="Phone number" name="phone" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.phone" />
        </a-form-item>
        <a-form-item label="Username" name="username" style="margin-bottom: 10px;">
          <a-input v-model:value="formData.username" />
        </a-form-item>
        <a-form-item label="Password" name="password" style="margin-bottom: 10px;">
          <a-input type="password" v-model:value="formData.password" />
        </a-form-item>
        <a-form-item label="Role" name="role" style="margin-bottom: 10px;">
          <a-select v-model:value="formData.role" placeholder="Chọn vai trò">
            <a-select-option value="isClient">User</a-select-option>
            <a-select-option value="isAdmin">Admin</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Trạng thái" name="status" style="margin-bottom: 10px;">
          <a-select v-model:value="formData.status" placeholder="Chọn trạng thái">
            <a-select-option value="active">Active</a-select-option>
            <a-select-option value="inactive">Inactive</a-select-option>
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
          title: 'Phone number',
          dataIndex: 'phone',
          key: 'phone',
        },
        {
          title: 'Username',
          dataIndex: 'username',
          key: 'username',
        },
        {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
        },
        {
          title: 'Actions',
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
        email: [{ required: true, message: 'Please enter email!' }],
        phone: [{ required: true, message: 'Please enter phone number!' }],
        username: [{ required: true, message: 'Please enter username!' }],
        password: [{ required: true, message: 'Please enter password!' }],
        role: [{ required: true, message: 'Please select a role!' }],
        status: [{ required: true, message: 'Please select a status!' }],
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
        message.error(error.message || 'An error occurred while loading the user!');
      }
    },
    async handleSearch(query) {
      try {
        const data = await searchUserByEmail(query);
        this.users = data;
      } catch (error) {
        message.error(error.message || 'An error occurred while searching for the user!');
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
            message.success('User updated successfully!');
          } else {
            await createUser(this.formData);
            message.success('User added successfully!');
          }
          this.isModalVisible = false;
          this.fetchUsers();
        } catch (error) {
          message.error(error.message || 'An error occurred!');
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
        message.success('User deleted successfully!');
        this.fetchUsers();
      } catch (error) {
        message.error(error.message || 'An error occurred!');
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