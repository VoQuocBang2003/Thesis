<template>
  <header>
    <a-layout-header class="custom-header">
      <div class="header-content">
        <!-- Logo -->
        <router-link
          to="/"
          class="logo-container"
        >
          <img
            src="@/assets/zgear-logo-white.png"
            alt="Logo"
            class="logo"
          />
        </router-link>

        <!-- Navigation -->
        <nav class="nav-links">
          <router-link
            to="/"
            class="nav-item"
            >{{ $t('header.homePage') }}</router-link
          >
          <router-link
            to="/products"
            class="nav-item"
            >{{ $t('header.products') }}</router-link
          >
        </nav>

        <!-- User Info & Dropdown -->
        <div class="user-cart-wrapper">
          <!-- Language Switcher -->
          <LanguageSwitcher />
          
          <div class="user-info">
            <span v-if="user.username">{{ $t('common.welcome') }}, {{ user.username }}!</span>
            <span v-else>{{ $t('common.welcome') }}!</span>
            <a-dropdown>
              <a
                class="ant-dropdown-link"
                @click.prevent
              >
                <span>▼</span>
              </a>
              <template v-slot:overlay>
                <a-menu>
                  <a-menu-item @click="goToProfile">{{ $t('header.profile') }}</a-menu-item>
                  <a-menu-item @click="goToFavorites">{{ $t('header.wishlist') }}</a-menu-item>
                  <a-menu-item @click="goToOrderManagement">{{ $t('header.cartManagement') }}</a-menu-item>
                  <a-menu-item @click="handleLogout">{{ $t('header.logout') }}</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <!-- Cart -->
          <div
            class="cart-info"
            @click="goToCart"
          >
            🛒 {{ cartCount }}
          </div>
        </div>
      </div>
    </a-layout-header>
  </header>
</template>

<script>
import { Layout, Dropdown, Menu } from 'ant-design-vue';
import { eventBus } from '../eventBus';
import LanguageSwitcher from './LanguageSwitcher.vue';

export default {
  name: 'AppHeader',
  components: {
    'a-layout-header': Layout.Header,
    'a-dropdown': Dropdown,
    'a-menu': Menu,
    'a-menu-item': Menu.Item,
    LanguageSwitcher
  },
  data() {
    return {
      user: {}
    };
  },
  created() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
      this.user = {}; // fallback to empty object
    }
  },
  computed: {
    cartCount() {
      return eventBus.cartCount;
    }
  },
  methods: {
    goToProfile() {
      this.$router.push('/profile');
    },
    goToFavorites() {
      this.$router.push('/favorites');
    },
    goToOrderManagement() {
      this.$router.push('/orders');
    },
    async handleLogout() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        // Clear cart from localStorage
        localStorage.removeItem(`cart_${user.id}`);
        // Clear cart from database by calling API if needed
        try {
          const { clearCart } = await import('@/apis/cartApi');
          await clearCart(user.id);
        } catch (err) {
          // Silently fail if clearCart doesn't exist or fails
          console.warn('Cart clear optional:', err);
        }
      }

      // Clear all user data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('cart');
      
      // Reset eventBus
      eventBus.setUser(null);
      eventBus.updateCartCount(0);

      // Navigate to login and reload
      this.$router.push('/login').then(() => {
        window.location.reload();
      });
    },
    goToCart() {
      this.$router.push('/cart');
    }
  }
};
</script>

<style scoped>
.custom-header {
  background-color: #0b0c10;
  color: #ffffff;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  height: 64px;
  max-width: 1280px;
  margin: 0 auto;
}

/* Logo */
.logo-container {
  margin-right: 40px;
}
.logo {
  height: 40px;
  object-fit: contain;
}

/* Navigation */
.nav-links {
  display: flex;
  gap: 24px;
}
.nav-item {
  color: #f1f1f1;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}
.nav-item:hover {
  color: #ffcc00;
}

/* User & Cart */
.user-cart-wrapper {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 20px;
}

.user-info {
  color: #f1f1f1;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-info {
  color: #ffcc00;
  font-weight: bold;
  cursor: pointer;
}
.cart-info:hover {
  text-decoration: underline;
}
</style>
