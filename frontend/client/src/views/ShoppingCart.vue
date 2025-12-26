<template>
  <div class="cart-container">
    <h2>{{ $t('cart.title') }} ({{ cart.length }} {{ $t('cart.products') }})</h2>
    <div
      v-if="cart.length === 0"
      class="empty-cart"
    >
      {{ $t('cart.empty') }}
    </div>
    <div v-else>
      <div class="cart-items">
        <div
          v-for="item in cart"
          :key="item.id"
          class="cart-item"
        >
          <img
            :src="item.image"
            alt="Book cover"
            class="cart-item-image"
          />
          <div class="cart-item-info">
            <h3>{{ item.title }}</h3>
            <p>
              {{ $t('cart.unitPrice') }}: <span class="price">{{ formatPrice(item.price) }} VNĐ</span>
            </p>
            <div class="quantity-control">
              <button @click="updateQuantity(item, -1)">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="updateQuantity(item, 1)">+</button>
            </div>
            <p>
              {{ $t('cart.totalPrice') }}:
              <span class="price">{{ formatPrice(item.price * item.quantity) }} VNĐ</span>
            </p>
            <button
              @click="removeFromCart(item)"
              class="remove-button"
            >
              {{ $t('cart.delete') }}
            </button>
          </div>
        </div>
      </div>
      <div class="cart-summary">
        <p>
          {{ $t('cart.total') }}: <span class="price">{{ formatPrice(totalPrice) }} VNĐ</span>
        </p>
        
        <!-- Voucher Section -->
        <div class="voucher-section" style="margin: 20px 0">
          <label class="payment-label">{{ $t('cart.voucherCode') }}:</label>
          <div style="display: flex; gap: 8px; margin-top: 8px">
            <a-input
              v-model:value="voucherCode"
              :placeholder="$t('cart.enterVoucherCode')"
              style="flex: 1"
              @pressEnter="applyVoucher"
            />
            <a-button
              type="primary"
              @click="applyVoucher"
              :loading="validatingVoucher"
            >
              {{ $t('cart.apply') }}
            </a-button>
            <a-button
              v-if="appliedVoucher"
              @click="removeVoucher"
            >
              {{ $t('cart.remove') }}
            </a-button>
          </div>
          <div v-if="voucherError" style="margin-top: 8px">
            <a-alert
              :message="voucherError"
              type="error"
              show-icon
              closable
              @close="voucherError = ''"
            />
          </div>
          <div v-if="appliedVoucher" style="margin-top: 8px">
            <a-alert
              :message="$t('cart.voucherApplied', { code: appliedVoucher.voucher.code })"
              :description="appliedVoucher.applicableProducts && appliedVoucher.applicableProducts.length > 0 
                ? $t('cart.discountWithProducts', { amount: formatPrice(appliedVoucher.discount || 0), count: getApplicableProductsCount() })
                : $t('cart.discount', { amount: formatPrice(appliedVoucher.discount || 0) })"
              type="success"
              show-icon
            />
          </div>
        </div>

        <!-- Discount Display -->
        <div v-if="appliedVoucher" style="margin: 10px 0">
          <p>
            {{ $t('cart.subtotal') }}: <span class="price">{{ formatPrice(totalPrice) }} VNĐ</span>
          </p>
          <p>
            {{ $t('cart.discountLabel') }}: <span class="price" style="color: #52c41a">-{{ formatPrice(appliedVoucher.discount || 0) }} VNĐ</span>
          </p>
          <p style="font-size: 1.2em; font-weight: bold; margin-top: 10px">
            {{ $t('cart.finalTotal') }}: <span class="price" style="color: #e74c3c">{{ formatPrice(finalPrice) }} VNĐ</span>
          </p>
        </div>
        
        <div
          class="payment-method"
          style="margin: 20px 0"
        >
          <label
            for="payment-method"
            class="payment-label"
            >{{ $t('cart.paymentMethod') }}:</label
          >
          <a-select
            v-model:value="selectedPaymentMethod"
            class="payment-select"
            :placeholder="$t('cart.selectPaymentMethod')"
          >
            <a-select-option value="cod">{{ $t('cart.cashOnDelivery') }}</a-select-option>
          </a-select>
        </div>
        
        <div class="shipping-address" style="margin: 20px 0">
          <label class="payment-label">{{ $t('cart.shippingAddress') }}:</label>
          <a-textarea
            v-model:value="shippingAddress"
            :rows="3"
            :placeholder="$t('cart.enterShippingAddress')"
            class="address-textarea"
          />
          <div v-if="!shippingAddress" class="address-warning">
            <a-alert
              :message="$t('cart.noShippingAddress')"
              :description="$t('cart.enterShippingAddressDesc')"
              type="warning"
              show-icon
              style="margin-top: 8px"
            />
          </div>
        </div>
        <button
          class="checkout-button"
          @click="checkout"
        >
          {{ $t('cart.purchase') }}
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { getCartByUser, updateCartItem, deleteCartItem } from '@/apis/cartApi';
import { createOrder } from '@/apis/ordersApi';
import { validateVoucher } from '@/apis/vouchersApi';
import { eventBus } from '@/eventBus';

export default {
  name: 'ShoppingCart',
  data() {
    // Nếu chưa đăng nhập thì cart luôn rỗng
    const userId = this.getUserId();
    return {
      cart: [],
      selectedPaymentMethod: 'cod',
      shippingAddress: '',
      userId,
      voucherCode: '',
      appliedVoucher: null,
      voucherError: '',
      validatingVoucher: false
    };
  },
  computed: {
    totalPrice() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },
    totalQuantity() {
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },
    finalPrice() {
      if (this.appliedVoucher && this.appliedVoucher.discount !== undefined && this.appliedVoucher.discount !== null) {
        const discount = parseFloat(this.appliedVoucher.discount) || 0;
        return Math.max(0, this.totalPrice - discount);
      }
      return this.totalPrice;
    }
  },
  methods: {
    async checkout() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        this.$message.error(this.$t('cart.mustLogin'));
        return;
      }

      // Validate địa chỉ giao hàng
      if (!this.shippingAddress.trim()) {
        this.$message.error(this.$t('cart.enterAddress'));
        return;
      }

      try {
        const orderData = {
          user_id: user.id,
          book_id: this.cart.map(item => ({ book_id: item.book_id, quantity: item.quantity })),
          quantity: this.totalQuantity,
          total_price: this.finalPrice,
          shipping_address: this.shippingAddress,
          payment_method: this.selectedPaymentMethod,
          voucher_code: this.appliedVoucher ? this.appliedVoucher.voucher.code : null,
          cart: this.cart.map(item => ({ book_id: item.book_id, quantity: item.quantity }))
        };

        await createOrder(orderData);

        for (const item of this.cart) {
          await deleteCartItem(user.id, item.book_id);
        }

        this.$message.success(this.$t('cart.orderSuccess'));
        this.cart = [];
        this.shippingAddress = '';
        this.voucherCode = '';
        this.appliedVoucher = null;
        this.voucherError = '';
        eventBus.updateCartCount(0);
      } catch (error) {
        console.error('Error purchasing:', error);
        this.$message.error(this.$t('cart.orderFailed'));
      }
    },
    formatPrice(value) {
      // Xử lý NaN, undefined, null
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return '0';
      }
      return new Intl.NumberFormat('vi-VN').format(numValue);
    },
    async fetchCart() {
      if (!this.userId) return;
      try {
        this.cart = await getCartByUser(this.userId);
        eventBus.updateCartCount(this.cart.length);
      } catch (err) {
        console.error('Failed to load cart', err);
      }
    },
    async updateQuantity(item, amount) {
      const user = JSON.parse(localStorage.getItem('user'));
      const newQty = item.quantity + amount;
      if (newQty < 1) return;

      try {
        await updateCartItem(user.id, item.book_id, newQty);
        await this.fetchCart();
      } catch (err) {
        console.error('Failed to update quantity', err);
      }
    },
    async removeFromCart(item) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        await deleteCartItem(user.id, item.book_id);
        await this.fetchCart();
      } catch (err) {
        console.error('Failed to remove from cart', err);
      }
    },
    getUserId() {
      const user = JSON.parse(localStorage.getItem('user'));
      return user ? user.id : null;
    },
    loadShippingAddress() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.address) {
        this.shippingAddress = user.address;
      }
    },
    async applyVoucher() {
      if (!this.voucherCode.trim()) {
        this.voucherError = this.$t('cart.pleaseEnterVoucherCode');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        this.voucherError = this.$t('cart.pleaseLoginForVoucher');
        return;
      }

      this.validatingVoucher = true;
      this.voucherError = '';

      try {
        // Gửi cart items để kiểm tra sản phẩm được phép áp dụng
        const cartItems = this.cart.map(item => ({
          book_id: item.book_id,
          id: item.book_id,
          price: item.price,
          quantity: item.quantity
        }));

        const result = await validateVoucher(this.voucherCode, this.totalPrice, user.id, cartItems);
        
        // Đảm bảo discount là số hợp lệ
        if (result && result.discount !== undefined && result.discount !== null) {
          result.discount = parseFloat(result.discount) || 0;
        } else {
          result.discount = 0;
        }
        
        this.appliedVoucher = result;
        
        // Hiển thị thông báo về sản phẩm được áp dụng nếu có
        if (result.applicableProducts && result.applicableProducts.length > 0) {
          this.$message.success(this.$t('cart.voucherAppliedSuccessWithProducts', { count: result.applicableProducts.length }));
        } else {
          this.$message.success(this.$t('cart.voucherAppliedSuccess'));
        }
      } catch (error) {
        this.voucherError = error.response?.data?.message || error.message || this.$t('cart.invalidVoucherCode');
        this.appliedVoucher = null;
      } finally {
        this.validatingVoucher = false;
      }
    },
    removeVoucher() {
      this.appliedVoucher = null;
      this.voucherCode = '';
      this.voucherError = '';
    },
    getApplicableProductsCount() {
      if (!this.appliedVoucher || !this.appliedVoucher.applicableProducts) return 0;
      const applicableIds = this.appliedVoucher.applicableProducts;
      return this.cart.filter(item => {
        const bookId = item.book_id || item.id;
        return applicableIds.includes(parseInt(bookId)) || applicableIds.includes(String(bookId));
      }).length;
    }
  },
  mounted() {
    // Nếu chưa đăng nhập thì luôn reset cartCount về 0 và xóa cart localStorage
    if (!this.userId) {
      this.cart = [];
      localStorage.removeItem('cart');
      eventBus.updateCartCount(0);
    } else {
      this.fetchCart();
    }
    this.loadShippingAddress();
  }
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
