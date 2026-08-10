<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { clearSession, getAdminEmail, getToken } from '../api'
import type { Locale } from '../i18n'

const router = useRouter()
const { t, locale } = useI18n()

const authed = computed(() => getToken() !== null)
const email = computed(() => getAdminEmail())

function logout(): void {
    clearSession()
    router.push({ name: 'public' })
}

function switchLocale(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Locale
    locale.value = value
    localStorage.setItem('limyrx_dashboard_locale', value)
}
</script>

<template>
    <header class="topbar">
        <router-link class="brand" :to="{ name: 'public' }">
            <span class="brand-mark">L</span>
            <span class="brand-name">{{ t('app.name') }}</span>
        </router-link>
        <nav class="nav">
            <router-link class="nav-link" :to="{ name: 'public' }">{{ t('nav.public') }}</router-link>
            <template v-if="authed">
                <router-link class="nav-link" :to="{ name: 'admin' }">{{ t('nav.overview') }}</router-link>
                <router-link class="nav-link" :to="{ name: 'players' }">{{ t('nav.players') }}</router-link>
                <router-link class="nav-link" :to="{ name: 'broadcasts' }">{{ t('nav.broadcasts') }}</router-link>
            </template>
        </nav>
        <div class="actions">
            <select class="lang-select" :value="locale" @change="switchLocale">
                <option value="en">EN</option>
                <option value="zh-CN">中文</option>
            </select>
            <template v-if="authed">
                <span class="email">{{ email }}</span>
                <button class="btn btn-ghost btn-sm" type="button" @click="logout">{{ t('nav.logout') }}</button>
            </template>
            <router-link v-else class="btn btn-sm" :to="{ name: 'login' }">{{ t('nav.login') }}</router-link>
        </div>
    </header>
</template>

<style scoped>
.topbar {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 14px 24px;
    background: var(--bg-elev);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 10;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-weight: 700;
    font-size: 16px;
}

.brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #fff;
    font-size: 15px;
}

.nav {
    display: flex;
    gap: 4px;
    flex: 1;
}

.nav-link {
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--text-dim);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition:
        color 0.15s ease,
        background 0.15s ease;
}

.nav-link:hover {
    color: var(--text);
    background: var(--bg-elev-2);
}

.nav-link.router-link-active {
    color: var(--text);
    background: var(--bg-elev-2);
}

.actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.lang-select {
    background: var(--bg-elev-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    padding: 6px 8px;
    font-size: 13px;
}

.email {
    color: var(--text-dim);
    font-size: 13px;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 13px;
}
</style>
