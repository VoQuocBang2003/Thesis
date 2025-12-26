<template>
  <div>
    <AppHeader />
    <a-layout style="min-height: 100vh">
      <a-layout>
        <a-layout-content style="margin: 0; background-color: #111;">
          <router-view />
        </a-layout-content>

        <!-- Footer theo style Corsair -->
        <a-layout-footer class="footer" style="background-color: black">
  <div class="footer-wrapper" style="background-color: black">
    <div class="footer-logo-center">
      <img
        src="@/assets/zgear-logo-white.png"
        alt="ZGear"
        class="footer-logo"
      />
    </div>

    <div class="footer-columns">
      <div class="footer-col">
        <h4>{{ $t('footer.shop') }}</h4>
        <ul>
          <li>{{ $t('footer.newProducts') }}</li>
          <li>{{ $t('footer.promotion') }}</li>
          <li>{{ $t('footer.whereToBuy') }}</li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{{ $t('footer.explore') }}</h4>
        <ul>
          <li>{{ $t('footer.pcBuilders') }}</li>
          <li>{{ $t('footer.innovation') }}</li>
          <li>{{ $t('footer.designLoop') }}</li>
          <li>{{ $t('footer.ambassadors') }}</li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{{ $t('footer.zgear') }}</h4>
        <ul>
          <li>{{ $t('footer.about') }}</li>
          <li>{{ $t('footer.investorRelations') }}</li>
          <li>{{ $t('footer.supplyChain') }}</li>
          <li>{{ $t('footer.contactUs') }}</li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{{ $t('footer.support') }}</h4>
        <ul>
          <li>{{ $t('footer.downloads') }}</li>
          <li>{{ $t('footer.firmwareUpdate') }}</li>
          <li>{{ $t('footer.shippingRMA') }}</li>
          <li>{{ $t('footer.termsOfSale') }}</li>
        </ul>
      </div>
    </div>

    <div class="footer-divider"></div>

    <div class="footer-bottom">
      <p>{{ $t('footer.copyright') }}</p>
      <p>
        <a href="#">{{ $t('footer.sitemap') }}</a> |
        <a href="#">{{ $t('footer.privacyPolicy') }}</a> |
        <a href="#">{{ $t('footer.termsOfUse') }}</a>
      </p>
    </div>
  </div>
</a-layout-footer>

      </a-layout>
    </a-layout>
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue';
import { isLoggedIn } from './store/authState';

export default {
  name: 'App',
  components: {
    AppHeader
  },
  setup() {
    return { isLoggedIn };
  },
};
</script>

<style>
.footer {
  background-color: #000;
  color: #000;
  padding: 60px 20px 30px;
  width: 100%;
}

.footer-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  color: #000;
}

.footer-logo-center {
  text-align: center;
  margin-bottom: 40px;
}
.footer-logo {
  height: 45px;
}

/* Cột menu */
.footer-columns {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 40px;
}
.footer-col {
  flex: 1 1 200px;
}
.footer-col h4 {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  border-bottom: 1px solid #444;
  padding-bottom: 6px;
  text-transform: uppercase;
}
.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-col ul li {
  margin-bottom: 10px;
  color: #aaa;
  font-size: 14px;
  transition: color 0.2s;
  cursor: pointer;
}
.footer-col ul li:hover {
  color: #ffcc00;
}

/* Divider */
.footer-divider {
  border-top: 1px solid #333;
  margin: 30px 0;
}

/* Bottom copyright */
.footer-bottom {
  text-align: center;
  font-size: 13px;
  color: #888;
}
.footer-bottom a {
  color: #888;
  text-decoration: none;
  margin: 0 6px;
}
.footer-bottom a:hover {
  color: #ffcc00;
}

/* Responsive */
@media (max-width: 768px) {
  .footer-columns {
    flex-direction: column;
    align-items: center;
  }
  .footer-col {
    text-align: center;
  }
}

</style>
