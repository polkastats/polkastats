<template>
  <b-dropdown id="languages" variant="none" class="mb-0" :text="lang">
    <b-dropdown-item @click="setLanguage('en')">English</b-dropdown-item>
    <b-dropdown-item @click="setLanguage('es')">Español</b-dropdown-item>
  </b-dropdown>
</template>

<script>
export default {
  data() {
    return {
      lang: 'English',
    }
  },
  created() {
    const { locale } = this.$store.state.locales
    this.setLanguage(locale)
  },
  methods: {
    setLanguage(locale) {
      switch (locale) {
        case 'en':
          this.lang = 'English'
          this.$store.commit('locales/SET_LANG', locale)
          this.$i18n.locale = locale
          break
        case 'es':
          this.lang = 'Español'
          this.$store.commit('locales/SET_LANG', locale)
          this.$i18n.locale = locale
          break
        default:
          this.lang = 'English'
          this.$store.commit('locales/SET_LANG', locale)
          this.$i18n.locale = locale
          break
      }
    },
  },
}
</script>
