import { createRouter, createWebHistory } from 'vue-router';

// Views
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import BooksView from '@/views/BooksView.vue';
import ProductsView from '@/views/ProductsView.vue';
import ShoppingCart from '@/views/ShoppingCart.vue';
import OrderView from '@/components/OrderView.vue';
import ProfileView from '@/views/ProfileView.vue';
import DebugProfile from '@/views/DebugProfile.vue'; 

// Components (dùng như trang - nếu cần)
import BookDetails from '@/components/BookDetails.vue';
import Wishlist from '@/components/Wishlist.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView, meta: { showHeaderFooter: true } },
  { path: '/login', name: 'Login', component: LoginView, meta: { showHeaderFooter: false } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { showHeaderFooter: false } },
  { path: '/book/:id', name: 'BookDetails', component: BookDetails, meta: { showHeaderFooter: true } },
  { path: '/cart', name: 'Cart', component: ShoppingCart, meta: { showHeaderFooter: true } },
  { path: '/favorites', name: 'Wishlist', component: Wishlist, meta: { showHeaderFooter: true } },
  { path: '/books', name: 'Books', component: BooksView, meta: { showHeaderFooter: true } },
  { path: '/products', name: 'Products', component: ProductsView, meta: { showHeaderFooter: true } },
  { path: '/orders', name: 'Orders', component: OrderView, meta: { showHeaderFooter: true } },
  { path: '/profile', name: 'Profile', component: ProfileView, meta: { showHeaderFooter: true, requiresAuth: true } },
  { path: '/debug-profile', name: 'DebugProfile', component: DebugProfile, meta: { showHeaderFooter: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard để kiểm tra authentication
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Nếu route yêu cầu authentication và user chưa đăng nhập
  if (to.meta.requiresAuth && (!token || !user)) {
    next('/login');
  } else {
    next();
  }
});

export default router;
