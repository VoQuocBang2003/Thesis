import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import { eventBus } from './eventBus';
import i18nPlugin, { i18n } from './i18n';

eventBus.initializeUser();

// Wait for translations to load before mounting the app
async function initializeApp() {
  try {
    console.log('🔄 Initializing app, waiting for translations...');
    await i18n.waitForTranslations();
    console.log('✅ Translations loaded, mounting app...');
    
    const app = createApp(App);
    app.use(router);
    app.use(pinia);
    app.use(Antd);
    app.use(i18nPlugin);
    app.mount('#app');
  } catch (error) {
    console.error('Error initializing app:', error);
    // Mount anyway with fallback translations
    const app = createApp(App);
    app.use(router);
    app.use(pinia);
    app.use(Antd);
    app.use(i18nPlugin);
    app.mount('#app');
  }
}

initializeApp();