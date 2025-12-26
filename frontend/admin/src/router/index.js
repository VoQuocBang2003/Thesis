import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import ProductManagement from '@/views/ProductManagement.vue';
import UserManagement from '@/views/UserManagement.vue';
import OrderManagement from '@/views/OrderManagement.vue';
import CategoryManagement from '@/views/CategoryManagement.vue';
import VoucherManagement from '@/views/VoucherManagement.vue';
import StatisticsView from '@/views/StatisticsView.vue';
import ReviewManagement from '@/views/ReviewManagement.vue';

const routes = [
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/', name: 'Home', component: HomeView },
  { path: '/products', name: 'Products', component: ProductManagement },
  { path: '/users', name: 'Users', component: UserManagement },
  { path: '/orders', name: 'Orders', component: OrderManagement },
  { path: '/categories', name: 'Categories', component: CategoryManagement },
  { path: '/vouchers', name: 'Vouchers', component: VoucherManagement },
  { path: '/statistics', name: 'Statistics', component: StatisticsView },
  { path: '/reviews', name: 'Reviews', component: ReviewManagement },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/login'];
  const authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('user');

  if (authRequired && !loggedIn) {
    return next('/login');
  }

  next();
});

export default router;