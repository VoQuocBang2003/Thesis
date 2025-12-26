// src/eventBus.js
import { reactive } from 'vue'

function safeGetCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart'))
    return Array.isArray(cart) ? cart.length : 0
  } catch {
    return 0
  }
}

function safeGetUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null
  } catch {
    return null
  }
}

export const eventBus = reactive({
  cartCount: safeGetCartCount(),
  user: safeGetUser(),

  updateCartCount(count) {
    this.cartCount = count
  },

  setUser(user) {
    this.user = user
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  },

  initializeUser() {
    this.user = safeGetUser()
    this.cartCount = safeGetCartCount()
  }
})
