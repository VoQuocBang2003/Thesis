<template>
   <div class="auth-container" :style="backgroundStyle">
    <div class="auth-overlay"></div>
        <div class="auth-background">

      <a-card class="auth-card" :bordered="false">
        <h2>{{ $t('auth.registerTitle') }}</h2>
        <p class="welcome-text">{{ $t('auth.registerSubtitle') }}</p>
        <a-form
          ref="registerForm"
          :model="formData"
          layout="vertical"
         @finish="handleRegister"
        >
          <a-form-item
            :label="$t('auth.email')"
            name="email"
            :rules="[
              { required: true, message: $t('auth.emailRequired') },
              { type: 'email', message: $t('auth.emailInvalid') }
            ]"
          >
            <a-input v-model:value="formData.email" :placeholder="$t('auth.emailPlaceholder')" />
          </a-form-item>

          <a-form-item
            :label="$t('auth.phone')"
            name="phone"
            :rules="[
              { required: true, message: $t('auth.phoneRequired') },
              
            ]"
          >
            <a-input v-model:value="formData.phone" :placeholder="$t('auth.phonePlaceholder')" />
          </a-form-item>

          <a-form-item
            :label="$t('auth.username')"
            name="username"
            :rules="[
              { required: true, message: $t('auth.usernameRequired') },
              { min: 3, message: $t('auth.usernameMinLength') }
            ]"
          >
            <a-input v-model:value="formData.username" :placeholder="$t('auth.usernamePlaceholder')" />
          </a-form-item>

          <a-form-item
            :label="$t('auth.password')"
            name="password"
            :rules="[
              { required: true, message: $t('auth.passwordRequired') },
              
            ]"
          >
            <a-input type="password" v-model:value="formData.password" :placeholder="$t('auth.passwordPlaceholder')" />
          </a-form-item>

          <a-button type="primary" html-type="submit" block class="register-button">{{ $t('auth.register') }}</a-button>
        </a-form>
        <p class="switch-text">{{ $t('auth.hasAccount') }} <a @click="switchToLogin">{{ $t('auth.loginNow') }}</a></p>
      </a-card>
    </div>
  </div>
</template>

<script>
import background from '@/assets/LOG-background.png';
import { registerUser } from '@/apis/authApi';
import { message } from 'ant-design-vue';

export default {
  name: 'RegisterView',
  data() {
    return {
      formData: {
        email: '',
        phone: '',
        username: '',
        password: '',
        role: 'isClient',
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
   async handleRegister(values) {
  try {
    const fullData = {
      ...values,
      role: 'isClient'
    };

    const response = await registerUser(fullData);
    if (response?.success) {
      message.success(response.message || this.$t('auth.registerSuccess'));
      this.$router.push('/login');
    } else {
      message.error(response.message || this.$t('auth.registerFailed'));
    }
  } catch (error) {
    console.error('Register error:', error);
    if (error.response) {
      message.error(error.response.data?.message || this.$t('auth.error'));
    } else {
      message.error(error.message || this.$t('auth.error'));
    }
  }
}

,
    switchToLogin() {
      this.$router.push('/login');
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

/* Overlay mờ tối */
.auth-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 0;
  pointer-events: none;
}

/* Block chứa form đăng ký */
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

/* Ant Input */
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

/* Ant Label */
::v-deep(.ant-form-item-label > label) {
  color: #ddd;
}

/* Nút đăng ký */
.register-button {
  margin-top: 16px;
  background-color: #ffcc00;
  border: none;
  color: #000;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.register-button:hover {
  background-color: #e6b800;
  color: #000;
}

/* Bỏ border card */
.ant-card-bordered {
  border: none;
  background-color: transparent;
}
</style>