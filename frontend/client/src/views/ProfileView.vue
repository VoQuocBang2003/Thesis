<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>{{ $t('profile.title') }}</h1>
    </div>

    <a-row :gutter="24">
      <!-- Thông tin cá nhân -->
      <a-col :span="12">
        <a-card :title="$t('profile.personalInfo')" class="profile-card">
          <a-form
            :model="profileForm"
            :rules="profileRules"
            @finish="updateProfile"
            layout="vertical"
          >
            <a-form-item :label="$t('profile.email')" name="email">
              <a-input v-model:value="profileForm.email" disabled />
            </a-form-item>

            <a-form-item :label="$t('profile.username')" name="username">
              <a-input v-model:value="profileForm.username" />
            </a-form-item>

            <a-form-item :label="$t('profile.phone')" name="phone">
              <a-input v-model:value="profileForm.phone" />
            </a-form-item>

            <a-form-item :label="$t('profile.shippingAddress')" name="address">
              <a-textarea 
                v-model:value="profileForm.address" 
                :rows="3" 
                :placeholder="$t('profile.addressPlaceholder')"
              />
            </a-form-item>

            <a-form-item :label="$t('profile.avatar')">
              <a-upload
                :file-list="fileList"
                :before-upload="beforeUpload"
                @change="handleChange"
                list-type="picture-card"
                :max-count="1"
              >
                <div v-if="fileList.length < 1">
                  <plus-outlined />
                  <div style="margin-top: 8px">{{ $t('profile.upload') }}</div>
                </div>
              </a-upload>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="updating">
                {{ $t('profile.updateInfo') }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- Đổi mật khẩu -->
      <a-col :span="12">
        <a-card :title="$t('profile.changePassword')" class="profile-card">
          <a-form
            :model="passwordForm"
            :rules="passwordRules"
            @finish="handleChangePassword"
            layout="vertical"
          >
            <a-form-item :label="$t('profile.currentPassword')" name="currentPassword">
              <a-input-password v-model:value="passwordForm.currentPassword" />
            </a-form-item>

            <a-form-item :label="$t('profile.newPassword')" name="newPassword">
              <a-input-password v-model:value="passwordForm.newPassword" />
            </a-form-item>

            <a-form-item :label="$t('profile.confirmPassword')" name="confirmPassword">
              <a-input-password v-model:value="passwordForm.confirmPassword" />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="changingPassword">
                {{ $t('profile.changePasswordBtn') }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>

    <!-- Lịch sử đơn hàng -->
    <a-row style="margin-top: 24px">
      <a-col :span="24">
        <a-card :title="$t('profile.orderHistory')" class="profile-card">
          <a-table
            :columns="orderColumns"
            :data-source="orderHistory"
            :loading="loadingOrders"
            :pagination="{ pageSize: 10 }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              <template v-if="column.key === 'total_price'">
                {{ formatPrice(record.total_price) }}
              </template>
              <template v-if="column.key === 'order_date'">
                {{ formatDate(record.order_date) }}
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewOrderDetails(record)">
                  {{ $t('profile.viewDetails') }}
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- Modal chi tiết đơn hàng -->
    <a-modal
      v-model:open="orderDetailVisible"
      :title="$t('profile.orderDetails')"
      :footer="null"
      width="800px"
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
          <a-descriptions-item v-if="selectedOrder.voucher" label="Mã giảm giá" :span="2">
            <a-tag color="green">
              {{ selectedOrder.voucher.code }} - {{ selectedOrder.voucher.name }}
            </a-tag>
            <span style="margin-left: 8px; color: #52c41a; font-weight: bold">
              -{{ formatPrice(selectedOrder.voucher.discount_amount || selectedOrder.discount_amount || 0) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="Tổng tiền (trước giảm giá)" v-if="selectedOrder.voucher">
            {{ formatPrice((selectedOrder.total_price || 0) + (selectedOrder.voucher.discount_amount || selectedOrder.discount_amount || 0)) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('orders.totalPrice')" :span="selectedOrder.voucher ? 1 : 2">
            <span :style="{ fontWeight: 'bold', color: selectedOrder.voucher ? '#e74c3c' : 'inherit', fontSize: selectedOrder.voucher ? '1.1em' : '1em' }">
            {{ formatPrice(selectedOrder.total_price) }}
            </span>
          </a-descriptions-item>
        </a-descriptions>

        <div style="margin-top: 16px">
          <h4>{{ $t('profile.products') }}:</h4>
          <a-list
            :data-source="selectedOrder.items"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar :src="item.book.image" />
                  </template>
                  <template #title>
                    {{ item.book.title }}
                  </template>
                  <template #description>
                    {{ $t('profile.author') }}: {{ item.book.author }} | {{ $t('profile.quantity') }}: {{ item.quantity }}
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <span>{{ formatPrice(item.book.price * item.quantity) }}</span>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { getUserProfile, updateUserProfile, changePassword } from '@/apis/userApi';
import { getOrderHistory } from '@/apis/ordersApi';
import { uploadImage } from '@/apis/uploadApi';
import { i18n } from '@/i18n';

export default {
  name: 'ProfileView',
  components: {
    PlusOutlined,
  },
  setup() {
    const profileForm = reactive({
      email: '',
      username: '',
      phone: '',
      address: '',
      image: '',
    });

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    const fileList = ref([]);
    const updating = ref(false);
    const changingPassword = ref(false);
    const loadingOrders = ref(false);
    const orderHistory = ref([]);
    const orderDetailVisible = ref(false);
    const selectedOrder = ref(null);

    const profileRules = computed(() => ({
      username: [
        { required: true, message: i18n.t('profile.usernameRequired') },
        { min: 3, message: i18n.t('profile.usernameMinLength') },
      ],
      phone: [
        { pattern: /^[0-9]{10,11}$/, message: i18n.t('profile.phoneInvalid') },
      ],
    }));

    const passwordRules = computed(() => ({
      currentPassword: [
        { required: true, message: i18n.t('profile.currentPasswordRequired') },
      ],
      newPassword: [
        { required: true, message: i18n.t('profile.newPasswordRequired') },
        { min: 6, message: i18n.t('profile.newPasswordMinLength') },
      ],
      confirmPassword: [
        { required: true, message: i18n.t('profile.confirmPasswordRequired') },
        {
          validator: (rule, value) => {
            if (value !== passwordForm.newPassword) {
              return Promise.reject(i18n.t('profile.confirmPasswordMismatch'));
            }
            return Promise.resolve();
          },
        },
      ],
    }));

    const orderColumns = computed(() => [
      {
        title: i18n.t('orders.orderId'),
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: i18n.t('orders.orderDate'),
        dataIndex: 'order_date',
        key: 'order_date',
      },
      {
        title: i18n.t('orders.status'),
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: i18n.t('orders.totalPrice'),
        dataIndex: 'total_price',
        key: 'total_price',
      },
      {
        title: i18n.t('common.actions'),
        key: 'action',
      },
    ]);

    const loadUserProfile = async () => {
      try {
        const response = await getUserProfile();
        console.log('Profile response:', response); // Debug log
        if (response.data.status === 'success') {
          const user = response.data.data;
          profileForm.email = user.email;
          profileForm.username = user.username;
          profileForm.phone = user.phone;
          profileForm.address = user.address || '';
          profileForm.image = user.image;
          
          if (user.image) {
            fileList.value = [{
              uid: '-1',
              name: 'avatar.jpg',
              status: 'done',
              url: user.image,
            }];
          }
        } else {
          console.error('Profile API error:', response.data);
          message.error(i18n.t('profile.loadProfileError') + ': ' + response.data.message);
        }
      } catch (error) {
        console.error('Profile API error:', error);
        message.error(i18n.t('profile.loadProfileError') + ': ' + (error.response?.data?.message || error.message));
      }
    };

    const loadOrderHistory = async () => {
      loadingOrders.value = true;
      try {
        const response = await getOrderHistory();
        console.log('Orders response:', response); // Debug log
        if (response.data.status === 'success') {
          orderHistory.value = response.data.data;
        } else {
          console.error('Orders API error:', response.data);
          message.error(i18n.t('profile.loadOrdersError') + ': ' + response.data.message);
        }
      } catch (error) {
        console.error('Orders API error:', error);
        message.error(i18n.t('profile.loadOrdersError') + ': ' + (error.response?.data?.message || error.message));
      } finally {
        loadingOrders.value = false;
      }
    };

    const updateProfile = async () => {
      updating.value = true;
      try {
        const response = await updateUserProfile(profileForm);
        if (response.data.status === 'success') {
          message.success(i18n.t('profile.updateSuccess'));
          // Cập nhật localStorage
          const user = JSON.parse(localStorage.getItem('user'));
          user.username = profileForm.username;
          user.phone = profileForm.phone;
          user.address = profileForm.address;
          user.image = profileForm.image;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        message.error(i18n.t('profile.updateFailed'));
      } finally {
        updating.value = false;
      }
    };

    const handleChangePassword = async () => {
      changingPassword.value = true;
      try {
        const response = await changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
        if (response.data.status === 'success') {
          message.success(i18n.t('profile.changePasswordSuccess'));
          // Reset form
          passwordForm.currentPassword = '';
          passwordForm.newPassword = '';
          passwordForm.confirmPassword = '';
        }
      } catch (error) {
        message.error(i18n.t('profile.changePasswordFailed'));
      } finally {
        changingPassword.value = false;
      }
    };

    const beforeUpload = (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error(i18n.t('profile.uploadImageError'));
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error(i18n.t('profile.uploadImageSizeError'));
        return false;
      }
      return true;
    };

    const handleChange = async (info) => {
      if (info.file.status === 'uploading') {
        return;
      }
      if (info.file.status === 'done') {
        try {
          const formData = new FormData();
          formData.append('image', info.file.originFileObj);
          const response = await uploadImage(formData);
          if (response.data.status === 'success') {
            profileForm.image = response.data.data.url;
            message.success(i18n.t('profile.uploadImageSuccess'));
          }
        } catch (error) {
          message.error(i18n.t('profile.uploadImageFailed'));
        }
      }
    };

    const viewOrderDetails = (order) => {
      selectedOrder.value = order;
      orderDetailVisible.value = true;
    };

    // Resolve image URL safely with a fallback in case import.meta.env isn't available
    let __VITE_API_URL_FALLBACK = 'http://127.0.0.1:3100';
    try {
      const maybe = import.meta?.env?.VITE_API_URL;
      if (maybe) __VITE_API_URL_FALLBACK = maybe;
    } catch (e) {
      console.warn('Could not read import.meta.env.VITE_API_URL, using fallback', e);
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

    const getStatusColor = (status) => {
      const colors = {
        pending: 'orange',
        confirmed: 'blue',
        shipping: 'purple',
        delivered: 'green',
        cancelled: 'red',
      };
      return colors[status] || 'default';
    };

    const getStatusText = (status) => {
      const statusKey = status?.toLowerCase();
      const statusMap = {
        pending: i18n.t('orders.statusPending'),
        confirmed: i18n.t('orders.statusConfirmed'),
        shipping: i18n.t('orders.statusShipping'),
        delivered: i18n.t('orders.statusDelivered'),
        canceled: i18n.t('orders.statusCanceled'),
        cancelled: i18n.t('orders.statusCanceled'),
      };
      return statusMap[statusKey] || status;
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN');
    };

    onMounted(() => {
      loadUserProfile();
      loadOrderHistory();
    });

    return {
      profileForm,
      passwordForm,
      fileList,
      updating,
      changingPassword,
      loadingOrders,
      orderHistory,
      orderDetailVisible,
      selectedOrder,
      profileRules,
      passwordRules,
      orderColumns,
      updateProfile,
      handleChangePassword,
      beforeUpload,
      handleChange,
      viewOrderDetails,
      getImageUrl,
      getStatusColor,
      getStatusText,
      formatPrice,
      formatDate,
    };
  },
};
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.profile-header {
  margin-bottom: 24px;
}

.profile-header h1 {
  margin: 0;
  color: #1890ff;
}

.profile-card {
  margin-bottom: 16px;
}

.ant-upload-select-picture-card {
  width: 100px;
  height: 100px;
}
</style>
