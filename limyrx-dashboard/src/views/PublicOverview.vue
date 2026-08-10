<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPublicStats } from '../api'
import type { PublicStats } from '../types'
import StatCard from '../components/StatCard.vue'
import ReleaseChart from '../components/ReleaseChart.vue'

const { t } = useI18n()

const stats = ref<PublicStats | null>(null)
const error = ref('')
const loading = ref(true)
const updatedAt = ref<Date | null>(null)
const refreshing = ref(false)

const mostDownloaded = computed(() => {
    if (!stats.value) return undefined
    return [...stats.value.downloads.perRelease].sort((a, b) => b.totalDownloads - a.totalDownloads)[0]
})

let timer: number | undefined

async function load(fromTimer = false): Promise<void> {
    if (fromTimer) {
        refreshing.value = true
    } else {
        loading.value = true
    }
    error.value = ''
    try {
        stats.value = await getPublicStats()
        updatedAt.value = new Date()
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    } finally {
        loading.value = false
        refreshing.value = false
    }
}

function fmtTime(date: Date): string {
    return date.toLocaleTimeString()
}

onMounted(() => {
    void load()
    timer = window.setInterval(() => void load(true), 30_000)
})

onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
})
</script>

<template>
    <div class="page">
        <div class="head">
            <div>
                <h1 class="page-title">{{ t('public.title') }}</h1>
                <p class="page-subtitle">{{ t('public.subtitle') }}</p>
            </div>
            <span class="live-badge" :class="{ on: !!updatedAt }">
                <span class="dot"></span>
                <span v-if="updatedAt">{{ t('public.lastUpdated') }} {{ fmtTime(updatedAt) }}</span>
                <span v-else>{{ t('common.loading') }}</span>
            </span>
        </div>

        <div v-if="loading && !stats" class="muted">{{ t('common.loading') }}</div>
        <div v-else-if="error && !stats" class="error">
            {{ t('common.error') }}: {{ error }}
            <button class="btn" type="button" @click="load()">{{ t('common.retry') }}</button>
        </div>
        <template v-else-if="stats">
            <section class="grid">
                <StatCard :label="t('public.downloads')" :value="stats.downloads.total" />
                <StatCard :label="t('common.installs')" :value="stats.installs" tone="cyan" />
                <StatCard :label="t('common.online')" :value="stats.onlineNow" tone="green" />
                <StatCard
                    :label="t('public.mostDownloaded')"
                    :value="mostDownloaded?.tag ?? '—'"
                    :hint="mostDownloaded ? mostDownloaded.totalDownloads.toLocaleString() : undefined"
                />
            </section>

            <section class="card">
                <h2 class="section-title">{{ t('public.releases') }}</h2>
                <ReleaseChart :releases="stats.downloads.perRelease" />
            </section>

            <section class="card release-card">
                <table>
                    <thead>
                        <tr>
                            <th>{{ t('public.releases') }}</th>
                            <th>{{ t('public.released') }}</th>
                            <th class="num">{{ t('public.downloads') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="release in [...stats.downloads.perRelease].sort((a, b) => b.totalDownloads - a.totalDownloads)"
                            :key="release.tag"
                            :class="{ top: release.tag === mostDownloaded?.tag }"
                        >
                            <td class="tag">
                                {{ release.tag }}
                                <span v-if="release.tag === mostDownloaded?.tag" class="crown">★</span>
                            </td>
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
.head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
}

.page-title {
    font-size: 26px;
    margin: 0 0 6px;
}

.page-subtitle {
    color: var(--text-dim);
    margin: 0;
}

.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-dim);
    font-size: 13px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 14px;
    white-space: nowrap;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-dim);
}

.live-badge.on .dot {
    background: var(--green);
    animation: pulse 1.8s ease-in-out infinite;
}

@keyframes pulse {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5);
    }
    50% {
        box-shadow: 0 0 0 6px rgba(52, 211, 153, 0);
    }
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.card {
    margin-bottom: 24px;
}

.release-card {
    overflow: hidden;
    padding: 0;
}

.release-card table {
    margin-top: 4px;
}

.tag {
    font-weight: 600;
    color: var(--accent-2);
}

.crown {
    color: #fbbf24;
}

tr.top td {
    background: rgba(124, 108, 255, 0.08);
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