<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPublicStats } from '../api'
import type { PublicStats } from '../types'
import StatCard from '../components/StatCard.vue'

const { t } = useI18n()

const stats = ref<PublicStats | null>(null)
const error = ref('')
const loading = ref(true)

async function load(): Promise<void> {
    error.value = ''
    loading.value = true
    try {
        stats.value = await getPublicStats()
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>

<template>
    <div class="page">
        <h1 class="page-title">{{ t('public.title') }}</h1>
        <p class="page-subtitle">{{ t('public.subtitle') }}</p>

        <div v-if="loading" class="muted">{{ t('common.loading') }}</div>
        <div v-else-if="error" class="error">
            {{ t('common.error') }}: {{ error }}
            <button class="btn" type="button" @click="load">{{ t('common.retry') }}</button>
        </div>
        <template v-else-if="stats">
            <section class="grid">
                <StatCard :label="t('public.downloads')" :value="stats.downloads.total" />
                <StatCard :label="t('common.installs')" :value="stats.installs" tone="cyan" />
                <StatCard :label="t('common.online')" :value="stats.onlineNow" tone="green" />
            </section>

            <section class="card release-card">
                <h2 class="section-title">{{ t('public.releases') }}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>{{ t('public.releases') }}</th>
                            <th>{{ t('public.released') }}</th>
                            <th class="num">{{ t('public.downloads') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="release in stats.downloads.perRelease" :key="release.tag">
                            <td class="tag">{{ release.tag }}</td>
                            <td>{{ new Date(release.publishedAt).toLocaleDateString() }}</td>
                            <td class="num">{{ release.totalDownloads.toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <p class="admin-hint">{{ t('public.adminHint') }}</p>
        </template>
    </div>
</template>

<style scoped>
.page-title {
    font-size: 26px;
    margin: 0 0 6px;
}

.page-subtitle {
    color: var(--text-dim);
    margin: 0 0 24px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.release-card {
    margin-bottom: 24px;
}

.tag {
    font-weight: 600;
    color: var(--accent-2);
}

.num {
    text-align: right;
}

.muted {
    color: var(--text-dim);
}

.error {
    color: var(--red);
}

.admin-hint {
    color: var(--text-dim);
    font-size: 13px;
    text-align: center;
}
</style>
