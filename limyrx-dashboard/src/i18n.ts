import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zhCN'

export type Locale = 'en' | 'zh-CN'

const STORAGE_KEY = 'limyrx_dashboard_locale'

function initialLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'zh-CN') {
        return stored
    }
    return navigator.language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function setLocale(locale: Locale): void {
    localStorage.setItem(STORAGE_KEY, locale)
}

export const i18n = createI18n({
    legacy: false,
    locale: initialLocale(),
    fallbackLocale: 'en',
    messages: {
        en,
        'zh-CN': zhCN,
    },
})
