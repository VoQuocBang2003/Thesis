<template>
  <div class="home-view">
    <!-- Hero Video Section -->
    <section class="hero-section">
      <video
        class="hero-video"
        autoplay
        muted
        loop
        playsinline
      >
        <source
          src="https://assets.corsair.com/video/upload/f_auto/q_auto/v1763766988/akamai/hybris/homepage/refresh/black-friday-2025-hp-1080.mp4"
          type="video/mp4"
        />
        {{ $t('home.videoNotSupported') }}
      </video>
    </section>

    <!-- Product Categories -->
    <section class="categories-section">
      <div class="section-title">{{ $t('home.products') }}</div>
      <div class="category-grid">
        <div
          class="category-card"
          v-for="(category, index) in categories"
          :key="index"
        >
          <img :src="category.image" :alt="category.title" />
          <div class="overlay">
            <h3>{{ category.title }}</h3>
            <a href="/products" class="shop-now">{{ $t('home.shopNow') }}</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      categories: [
        {
          title: 'GAMING KEYBOARD',
          image: 'https://assets.corsair.com/image/upload/f_auto/q_auto/v1731029132/akamai/hybris/homepage/refresh/Gaming_Keyboards_Tile_without_text.png',
        },
        {
          title: 'GAMING MOUSE',
          image: 'https://assets.corsair.com/image/upload/f_auto/q_auto/v1748382136/akamai/hybris/homepage/refresh/category-tile-Gaming-Mice.png',
        },
        {
          title: 'GAMING HEADSETS',
          image: 'https://assets.corsair.com/image/upload/f_auto/q_auto/v1761883509/pages/homepage-ab/category/hp-cat-headsets.png',
        },
        {
          title: 'GAMING PC',
          image: 'https://assets.corsair.com/image/upload/f_auto/q_auto/v1761883509/pages/homepage-ab/category/hp-cat-systems.png',
        },
        {
          title: 'CONSOLE',
          image: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/03/game-console-2.jpg',
        },
        {
          title: 'CONTROLLER',
          image: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/03/game-console-2.jpg',
        },
        {
          title: 'GAMECARD',
          image: 'https://assets.corsair.com/image/upload/f_auto/q_auto/v1761883507/pages/homepage-ab/category/hp-cat-dram.png',
        },
        {
          title: 'MONITOR',
          image: 'https://assets.corsair.com/image/upload/c_pad,q_85,h_360,w_360/products/Monitors/CM-9020007/XENEON_315QHD165_Gaming_Monitor_01.webp',
        },
      ],
    };
  },
};
</script>

<style scoped>
.home-view {
  background-color: #0a0a0a;
  color: #ffffff;
  font-family: 'Helvetica Neue', sans-serif;
  scroll-behavior: smooth;
  overflow-x: hidden;
}

/* Hero Video */
.hero-section {
  width: 100vw;
  height: 60vh;
  overflow: hidden;
  position: relative;
}
.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Section Title */
.section-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 40px 16px 20px;
  color: #ffcc00;
  text-align: center;
}

/* Category Grid */
.categories-section {
  padding: 0 16px 60px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.category-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background-color: #1a1a1d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}
.category-card:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 30px rgba(255, 255, 255, 0.1);
}
.category-card img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
}

/* Overlay Info */
.overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}
.overlay h3 {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: bold;
}
.shop-now {
  color: #ffcc00;
  font-size: 0.95rem;
  text-decoration: none;
  font-weight: 500;
}
.shop-now:hover {
  text-decoration: underline;
}
</style>
