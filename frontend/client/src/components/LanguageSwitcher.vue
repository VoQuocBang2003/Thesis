<template>
  <div class="language-switcher">
    <a-dropdown :trigger="['click']" placement="bottomRight">
      <a class="language-trigger" @click.prevent>
        <span class="language-icon">🌐</span>
        <span class="language-text">{{ currentLanguageLabel }}</span>
        <span class="language-arrow">▼</span>
      </a>
      <template v-slot:overlay>
        <a-menu @click="handleLanguageChange">
          <a-menu-item :key="'vi'" :class="{ active: currentLocale === 'vi' }">
            <span class="flag">🇻🇳</span>
            <span>Tiếng Việt</span>
          </a-menu-item>
          <a-menu-item :key="'en'" :class="{ active: currentLocale === 'en' }">
            <span class="flag">🇺🇸</span>
            <span>English</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script>
import { Dropdown, Menu } from 'ant-design-vue';
import { i18n } from '@/i18n';

export default {
  name: 'LanguageSwitcher',
  components: {
    'a-dropdown': Dropdown,
    'a-menu': Menu,
    'a-menu-item': Menu.Item
  },
  data() {
    return {
      currentLocale: i18n.getLocale()
    };
  },
  computed: {
    currentLanguageLabel() {
      return this.currentLocale === 'vi' ? 'VI' : 'EN';
    }
  },
  mounted() {
    // Listen for locale changes
    window.addEventListener('locale-changed', this.handleLocaleChanged);
  },
  beforeUnmount() {
    window.removeEventListener('locale-changed', this.handleLocaleChanged);
  },
  methods: {
    handleLocaleChanged(event) {
      this.currentLocale = event.detail.locale;
      // Force component update
      this.$forceUpdate();
    },
    handleLanguageChange({ key }) {
      if (key === 'vi' || key === 'en') {
        i18n.setLocale(key);
        this.currentLocale = key;
        // Refresh page to apply changes
        // Or use reactive update if components support it
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }
};
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

.language-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f1f1f1;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.2s;
  text-decoration: none;
}

.language-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
}

.language-icon {
  font-size: 18px;
}

.language-text {
  font-weight: 600;
  font-size: 14px;
}

.language-arrow {
  font-size: 10px;
  opacity: 0.7;
}

.flag {
  margin-right: 8px;
  font-size: 18px;
}

:deep(.ant-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.ant-menu-item.active) {
  background-color: #ff6b35;
  color: #000;
  font-weight: 600;
}
</style>

