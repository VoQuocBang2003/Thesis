<template>
  <div class="promo-card">
    <img :src="image" alt="Promotion Image" class="promo-image" />
  </div>
</template>

<script>
export default {
  name: 'PromoCard',
  props: {
    title: String,
    image: String,
  },
};
</script>

<style scoped>
.promo-card {
  margin-bottom: 20px; 
  background-color: #f00;
  color: #fff;
  border-radius: 8px;
  overflow: hidden;
  width: 23%;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.promo-image {
  width: 100%;
  height: auto;
}

.promo-content {
  padding: 10px;
}

.buy-button {
  background-color: #d00;
  color: #fff;
  border: none;
  padding: 10px 20px;
  margin-top: 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.buy-button:hover {
  background-color: #b00;
}
</style> 