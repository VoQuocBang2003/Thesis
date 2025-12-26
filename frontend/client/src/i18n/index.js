// i18n Service - Simple internationalization without external packages
class I18n {
  constructor() {
    this.locale = localStorage.getItem('app_locale') || 'vi';
    this.translations = {
      vi: {},
      en: {}
    };
    this.loadingPromise = null;
    this.loadTranslations();
  }

  async loadTranslations() {
    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        console.log('🔄 Loading translations...');
        const [viModule, enModule] = await Promise.all([
          import('./locales/vi.json').then(m => m.default).catch(() => null),
          import('./locales/en.json').then(m => m.default).catch(() => null)
        ]);

        if (viModule && Object.keys(viModule).length > 0) {
          this.translations.vi = viModule;
          console.log('✅ Vietnamese translations loaded');
        } else {
          console.warn('⚠️ Vietnamese translations not loaded, using fallback');
          this.translations.vi = { common: {}, header: {}, chatbot: {}, products: {}, cart: {}, footer: {} };
        }

        if (enModule && Object.keys(enModule).length > 0) {
          this.translations.en = enModule;
          console.log('✅ English translations loaded');
        } else {
          console.warn('⚠️ English translations not loaded, using fallback');
          this.translations.en = { common: {}, header: {}, chatbot: {}, products: {}, cart: {}, footer: {} };
        }

        // Dispatch event that translations are loaded
        window.dispatchEvent(new CustomEvent('translations-loaded', { detail: { locale: this.locale } }));
      } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback translations
        this.translations.vi = this.translations.vi || { common: {}, header: {}, chatbot: {}, products: {}, cart: {}, footer: {} };
        this.translations.en = this.translations.en || { common: {}, header: {}, chatbot: {}, products: {}, cart: {}, footer: {} };
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  setLocale(locale) {
    if (['vi', 'en'].includes(locale)) {
      this.locale = locale;
      localStorage.setItem('app_locale', locale);
      // Trigger custom event for components to update
      window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
    }
  }

  getLocale() {
    return this.locale;
  }

  t(key, params = {}) {
    if (!key || typeof key !== 'string') {
      return key || '';
    }

    const keys = key.split('.');
    let value = this.translations[this.locale];

    // If translations not loaded yet, return key (will be updated when loaded)
    if (!value || Object.keys(value).length === 0) {
      // Try to load synchronously if possible, but return key for now
      if (!this.loadingPromise) {
        this.loadTranslations();
      }
      return key;
    }

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // If translation not found, try to return a fallback or the key
        console.warn(`⚠️ Translation key not found: ${key} for locale: ${this.locale}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`⚠️ Translation value is not a string for key: ${key}`);
      return key;
    }

    // Replace parameters in translation
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  // Wait for translations to be loaded
  async waitForTranslations() {
    if (this.loadingPromise) {
      await this.loadingPromise;
    }
    return this.translations[this.locale];
  }
}

// Create singleton instance
const i18n = new I18n();

// Vue plugin
export default {
  install(app) {
    app.config.globalProperties.$t = (key, params) => i18n.t(key, params);
    app.config.globalProperties.$i18n = i18n;
    app.provide('i18n', i18n);
  }
};

// Export instance for direct use
export { i18n };

