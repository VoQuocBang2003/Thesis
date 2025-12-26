<template>
  <div class="auth-container" :style="backgroundStyle">
    <div class="auth-overlay"></div>
    <div class="auth-background">
      <a-card class="auth-card" bordered="false">
        <h2>ZGear - Admin only!</h2>
        <p class="welcome-text">Please log in to continue!</p>
        <a-form :model="formData" @submit.prevent="handleLogin" layout="vertical">
          <a-form-item label="Email" name="email" :rules="[ { required: true, message: 'Please enter email!' } ]">
            <a-input v-model:value="formData.email" placeholder="Enter your email" />
          </a-form-item>
          <a-form-item label="Password" name="password" :rules="[ { required: true, message: 'Please enter password!' } ]">
            <a-input type="password" v-model:value="formData.password" placeholder="Enter your password" />
          </a-form-item>
          <a-button type="primary" html-type="submit" block class="login-button">Login</a-button>
        </a-form>
      </a-card>
    </div>
  </div>
</template>

<script>
import background from '@/assets/LOG-background.png'; // bạn có thể thay đường dẫn ảnh tại đây
import { loginUser } from '@/apis/authApi';
import { message } from 'ant-design-vue';
import { isLoggedIn } from '@/store/authState';

export default {
  name: 'LoginView',
  data() {
    return {
      formData: {
        email: '',
        password: '',
      },
      backgroundStyle: {
        backgroundImage: `url(${background})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
      },
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await loginUser(this.formData);
        if (response.success) {
          const user = response.data.user;
          // Check for admin role (support both 'isAdmin' and 'admin')
          if (user.role !== 'isAdmin' && user.role !== 'admin') {
            message.error('You do not have access. Only administrators can log in.');
            return;
          }

          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', JSON.stringify(response.data.token));

          isLoggedIn.value = true;
          this.$router.push('/');
          message.success('Login successful!');
        } else {
          message.error(response.message || 'Login failed!');
        }
      } catch (error) {
        message.error(error.message || 'An error occurred!');
      }
    },
  },
};
</script>

<style scoped>
.auth-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

.auth-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 0;
}

.auth-background {
  background-color: rgba(20, 20, 20, 0.4);
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  z-index: 1;
  position: relative;
}

.auth-card {
  width: 400px;
  text-align: center;
  color: #f1f1f1;
  background: transparent;
}

.auth-card h2 {
  margin-bottom: 10px;
  color: #ffcc00;
  font-weight: 700;
  font-size: 22px;
  text-transform: uppercase;
}

.welcome-text {
  margin-bottom: 24px;
  color: #bbb;
}

::v-deep(.ant-input) {
  background-color: #1a1a1d;
  border: 1px solid #555;
  color: #fff;
}
::v-deep(.ant-input::placeholder) {
  color: #777;
}
::v-deep(.ant-input:focus) {
  border-color: #ffcc00 !important;
  box-shadow: 0 0 0 2px rgba(255, 204, 0, 0.3);
}

::v-deep(.ant-form-item-label > label) {
  color: #ddd;
}

.login-button {
  margin-top: 16px;
  background-color: #ffcc00;
  border: none;
  color: #000;
  font-weight: bold;
  transition: background-color 0.3s ease;
}
.login-button:hover {
  background-color: #e6b800;
  color: #000;
}

.ant-card-bordered {
  border: none;
  background-color: transparent;
}
</style>
