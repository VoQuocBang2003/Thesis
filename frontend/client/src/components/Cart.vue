<template>
  <div class="cart-container">
    <h2>{{ $t('cart.title') }} ({{ cart.length }} {{ $t('cart.products') }})</h2>
    <div v-if="cart.length === 0" class="empty-cart">{{ $t('cart.empty') }}</div>
    <div v-else>
      <div class="cart-items">
        <div v-for="item in cart" :key="item.id" class="cart-item">
          <img :src="item.image" alt="Book cover" class="cart-item-image" />
          <div class="cart-item-info">
            <h3>{{ item.title }}</h3>
            <p>{{ $t('cart.unitPrice') }}: <span class="price">{{ formatPrice(item.price) }} VNĐ</span></p>
            <div class="quantity-control">
              <button @click="updateQuantity(item, -1)">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="updateQuantity(item, 1)">+</button>
            </div>
            <p>{{ $t('cart.totalPrice') }}: <span class="price">{{ formatPrice(item.price * item.quantity) }} VNĐ</span></p>
            <button @click="removeFromCart(item.id)" class="remove-button">{{ $t('cart.delete') }}</button>
          </div>
        </div>
      </div>
      <div class="cart-summary">
        <p>{{ $t('cart.totalPrice') }}: <span class="price">{{ formatPrice(totalPrice) }} VNĐ</span></p>
        <div class="payment-method" style="margin: 20px 0;">
          <label for="payment-method" class="payment-label">{{ $t('cart.paymentMethod') }}:</label>
          <a-select v-model:value="selectedPaymentMethod" class="payment-select" :placeholder="$t('cart.selectPaymentMethod')">
            <a-select-option value="cod">{{ $t('cart.cashOnDelivery') }}</a-select-option>
          </a-select>
        </div>
        <button class="checkout-button" @click="checkout">{{ $t('cart.purchase') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { createOrder } from '../apis/ordersApi';
import { eventBus } from '@/eventBus';

export default {
  name: 'ShoppingCart',
  data() {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
      cart: [],
      selectedPaymentMethod: 'cod',
      userId: user ? user.id : null
    };
  },
  computed: {
    totalPrice() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },
    totalQuantity() {
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value);
    },
    updateQuantity(item, amount) {
      item.quantity += amount;
      if (item.quantity < 1) item.quantity = 1;
      this.saveCart();
    },
    removeFromCart(id) {
      this.cart = this.cart.filter(item => item.id !== id);
      this.saveCart();
    },
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart));
      eventBus.updateCartCount(this.cart.length);
    },
    async checkout() {
      try {
        const orderData = {
          book_id: this.cart,
          total_price: this.totalPrice,
          quantity: this.totalQuantity,
          user_id: this.userId,
          payment_method: this.selectedPaymentMethod,
        };
        const order = await createOrder(orderData);
        console.log('Order created successfully:', order);
        this.cart = [];
        this.saveCart();
        this.$message.success(this.$t('cart.orderSuccess'));
      } catch (error) {
        console.error('Error creating order:', error);
        this.$message.error(this.$t('cart.orderFailed'));
      }
    },
    async fetchCart() {
      // Nếu chưa đăng nhập thì cart rỗng và cartCount = 0
      if (!this.userId) {
        this.cart = [];
        localStorage.removeItem('cart');
        eventBus.updateCartCount(0);
        return;
      }
      // Nếu có API getCartByUser thì fetch ở đây, còn không thì lấy từ localStorage
      // this.cart = await getCartByUser(this.userId);
      // eventBus.updateCartCount(this.cart.length);
      // Nếu không có API thì lấy từ localStorage (nếu có)
      const cartLocal = JSON.parse(localStorage.getItem('cart')) || [];
      this.cart = cartLocal;
      eventBus.updateCartCount(this.cart.length);
    },
  },
  mounted() {
    this.fetchCart();
  },
};
</script>

<style scoped>
.cart-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cart-items {
  margin-bottom: 20px;
}

.cart-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-item-image {
  width: 80px;
  height: auto;
  margin-right: 20px;
  border-radius: 5px;
}

.cart-item-info {
  flex: 1;
}

.quantity-control {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.quantity-control button {
  padding: 5px 10px;
  background-color: #ddd;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.quantity-control span {
  margin: 0 10px;
}

.price {
  color: #e74c3c;
  font-weight: bold;
}

.remove-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  margin-top: 10px;
}

.cart-summary {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: right;
}

.payment-method {
  margin-bottom: 20px;
}

.checkout-button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.checkout-button:hover {
  background-color: #2980b9;
}

.empty-cart {
  text-align: center;
  font-size: 1.2em;
  color: #555;
}
</style> 