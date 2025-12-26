<template>
  <div class="auth-container" :style="backgroundStyle">
    <div class="auth-overlay"></div>
    <div class="auth-background">
      <a-card class="auth-card" bordered="false">
        <h2>{{ $t('auth.welcome') }}</h2>
        <p class="welcome-text">{{ $t('auth.loginSubtitle') }}</p>
        <a-form :model="formData" @submit.prevent="handleLogin" layout="vertical">
          <a-form-item :label="$t('auth.email')" name="email" :rules="[ { required: true, message: $t('auth.emailRequired') } ]">
            <a-input v-model:value="formData.email" :placeholder="$t('auth.emailPlaceholder')" />
          </a-form-item>
          <a-form-item :label="$t('auth.password')" name="password" :rules="[ { required: true, message: $t('auth.passwordRequired') } ]">
            <a-input type="password" v-model:value="formData.password" :placeholder="$t('auth.passwordPlaceholder')" />
          </a-form-item>
          <a-button type="primary" html-type="submit" block class="login-button">{{ $t('auth.login') }}</a-button>
        </a-form>
        <p class="switch-text">{{ $t('auth.noAccount') }} <a @click="switchToRegister">{{ $t('auth.registerNow') }}</a></p>
      </a-card>
    </div>
  </div>
</template>

<script>
import background from '@/assets/LOG-background.png';
import { loginUser } from '@/apis/authApi';
import { message } from 'ant-design-vue';
import { eventBus } from '@/eventBus';

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
      eventBus.setUser(response.data.user);
      localStorage.setItem('token', response.data.token);

      this.$router.push('/').then(() => {
        window.location.reload(); // 👉 Refresh toàn trang sau login
      });

      message.success(this.$t('auth.loginSuccess'));
    } else {
      message.error(response.message || this.$t('auth.loginFailed'));
    }
  } catch (error) {
    message.error(error.message || this.$t('auth.error'));
  }
},switchToRegister() {
      this.$router.push('/register');
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

/* Overlay layer (black semi-transparent + blur) */
.auth-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 0;
}

/* Login card block */
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

.switch-text {
  margin-top: 20px;
  color: #aaa;
  font-size: 14px;
}

.switch-text a {
  color: #ffcc00;
  font-weight: 500;
  cursor: pointer;
}

/* Ghi đè Ant Input */
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

/* Ghi đè Ant Label */
::v-deep(.ant-form-item-label > label) {
  color: #ddd;
}

/* Nút login */
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

/* Bỏ border thừa của card */
.ant-card-bordered {
  border: none;
  background-color: transparent;
}
</style>
