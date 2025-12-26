<template>
  <div style="padding: 20px;">
    <h2>Debug Profile Page</h2>
    
    <div style="margin-bottom: 20px;">
      <h3>LocalStorage Info:</h3>
      <p><strong>Token:</strong> {{ token }}</p>
      <p><strong>User:</strong> {{ user }}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h3>API Test:</h3>
      <button @click="testProfileAPI" :disabled="loading">Test Profile API</button>
      <button @click="testOrdersAPI" :disabled="loading">Test Orders API</button>
      <div v-if="loading">Loading...</div>
      <div v-if="apiResult">
        <h4>API Result:</h4>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3>Actions:</h3>
      <button @click="clearStorage">Clear Storage</button>
      <button @click="goToLogin">Go to Login</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getUserProfile } from '@/apis/userApi';
import { getOrderHistory } from '@/apis/ordersApi';

export default {
  name: 'DebugProfile',
  setup() {
    const token = ref('');
    const user = ref('');
    const loading = ref(false);
    const apiResult = ref(null);

    const loadStorageInfo = () => {
      token.value = localStorage.getItem('token') || 'No token';
      user.value = localStorage.getItem('user') || 'No user';
    };

    const testProfileAPI = async () => {
      loading.value = true;
      apiResult.value = null;
      try {
        const response = await getUserProfile();
        apiResult.value = {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        apiResult.value = {
          success: false,
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        };
      } finally {
        loading.value = false;
      }
    };

    const testOrdersAPI = async () => {
      loading.value = true;
      apiResult.value = null;
      try {
        const response = await getOrderHistory();
        apiResult.value = {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        apiResult.value = {
          success: false,
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        };
      } finally {
        loading.value = false;
      }
    };

    const clearStorage = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      loadStorageInfo();
    };

    const goToLogin = () => {
      this.$router.push('/login');
    };

    onMounted(() => {
      loadStorageInfo();
    });

    return {
      token,
      user,
      loading,
      apiResult,
      testProfileAPI,
      testOrdersAPI,
      clearStorage,
      goToLogin
    };
  }
};
</script>
