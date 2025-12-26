<template>
  <header>
    <a-layout-header style="background: #fff; padding: 0">
      <div class="header-content">
<img
  style="width: 160px; object-fit: contain"
  :src="require('@/assets/zgear-logo-white.png')"
  alt="Logo"
  class="logo"
/>
        <div class="user-info">
          <span>Hello, {{ user ? user.username : 'User' }}</span>
          <a-dropdown>
            <a class="ant-dropdown-link" @click.prevent>
              <span>▼</span>
            </a>
            <template v-slot:overlay>
              <a-menu>
                <a-menu-item @click="handleLogout">Logout</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </a-layout-header>
  </header>
</template>

<script>
import { Layout, Dropdown, Menu } from 'ant-design-vue';
import { isLoggedIn } from '@/store/authState';

export default {
  name: 'AppHeader',
  components: {
    'a-layout-header': Layout.Header,
    'a-dropdown': Dropdown,
    'a-menu': Menu,
    'a-menu-item': Menu.Item,
  },
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user')),
    };
  },
  methods: {
    goToProfile() {
      console.log('Navigating to profile...');
    },
    handleLogout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      isLoggedIn.value = false;
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.header-content {
  background-color: #111;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  height: 40px;
}

.user-info {
  margin-left: auto;
  font-weight: bold;
  color: white;
}
</style> 