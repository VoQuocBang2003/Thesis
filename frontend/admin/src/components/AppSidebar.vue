<template>
  <a-layout-sider v-model:collapsed="collapsed" collapsible width="200" class="site-layout-background">
    <a-menu
      mode="inline"
      :default-selected-keys="[selectedKey]"
      style="height: 100%; border-right: 0; background-color: #111;"
    >
      <a-menu-item key="1">
        <router-link to="/">Home page</router-link>
      </a-menu-item>
      <a-menu-item key="2">
        <router-link to="/products">Product Management</router-link>
      </a-menu-item>
      <a-menu-item key="3">
        <router-link to="/users">User Management</router-link>
      </a-menu-item>
      <a-menu-item key="4">
        <router-link to="/orders">Order Management</router-link>
      </a-menu-item>
      <a-menu-item key="5">
        <router-link to="/categories">Category Management</router-link>
      </a-menu-item>
      <a-menu-item key="6">
        <router-link to="/vouchers">Voucher Management</router-link>
      </a-menu-item>
      <a-menu-item key="7">
        <router-link to="/statistics">Statistics & Revenue</router-link>
      </a-menu-item>
      <a-menu-item key="8">
        <router-link to="/reviews">Review Management</router-link>
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script>
export default {
  name: 'AppSidebar',
  data() {
    return {
      collapsed: false,
    };
  },
  computed: {
    selectedKey() {
      const path = this.$route.path;
      if (path === '/') return '1';
      if (path === '/products') return '2';
      if (path === '/users') return '3';
      if (path === '/orders') return '4';
      if (path === '/categories') return '5';
      if (path === '/vouchers') return '6';
      if (path === '/statistics') return '7';
      if (path === '/reviews') return '8';
      return '1';
    },
  },
};
</script>

<style scoped>
/* Đổi màu chữ cho router-link bên trong menu */
::v-deep(.ant-menu-item a) {
  color: white;
}

::v-deep(.ant-menu-item-selected a) {
  color: #1890ff;
}

::v-deep(.ant-menu-item a:hover) {
  color: #40a9ff;
}

</style>