<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getOverview, getTimeseries } from '../api'
import type { OverviewStats, TimeseriesPoint, TimeseriesRange } from '../types'
import StatCard from '../components/StatCard.vue'
import TimeSeriesChart from '../components/TimeSeriesChart.vue'
import BarBreakdown from '../components/BarBreakdown.vue'

const { t } = useI18n()

const overview = ref<OverviewStats | null>(null)
const points = ref<TimeseriesPoint[]>([])
const range = ref<TimeseriesRange>('24h')
const error = ref('')
const loading = ref(true)

async function loadOverview(): Promise<void> {
    try {
        overview.value = await getOverview()
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    }
}

async function loadSeries(): Promise<void> {
    try {
        points.value = await getTimeseries(range.value)
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    }
}

async function loadAll(): Promise<void> {
    error.value = ''
    loading.value = true
    await Promise.all([loadOverview(), loadSeries()])
    loading.value = false
}

function setRange(next: TimeseriesRange): void {
    range.value = next
    void loadSeries()
}

onMounted(loadAll)
</script>

<template>
    <div class="page">
        <h1 class="page-title">{{ t('overview.title') }}</h1>

        <div v-if="loading" class="muted">{{ t('common.loading') }}</div>
        <div v-else-if="error" class="error">
            {{ t('common.error') }}: {{ error }}
            <button class="btn" type="button" @click="loadAll">{{ t('common.retry') }}</button>
        </div>
        <template v-else-if="overview">
            <section class="grid">
                <StatCard :label="t('overview.downloads')" :value="overview.totalDownloads" />
                <StatCard :label="t('overview.installs')" :value="overview.installs" tone="cyan" />
                <StatCard :label="t('overview.online')" :value="overview.onlineNow" tone="green" />
                <StatCard :label="t('overview.dau')" :value="overview.dau" tone="cyan" />
                <StatCard :label="t('overview.wau')" :value="overview.wau" tone="cyan" />
                <StatCard :label="t('overview.mau')" :value="overview.mau" tone="cyan" />
            </section>

            <section class="card">
                <div class="card-head">
                    <h2 class="section-title">{{ t('overview.activity') }}</h2>
                    <div class="range-tabs">
                        <button
                            v-for="r in ['24h', '7d', '30d'] as TimeseriesRange[]"
                            :key="r"
                            type="button"
                            class="range-tab"
                            :class="{ active: range === r }"
                            @click="setRange(r)"
                        >
                            {{ r }}
                        </button>
                    </div>
                </div>
                <TimeSeriesChart :points="points" :range="range" />
            </section>

            <section class="grid two">
                <div class="card">
                    <h2 class="section-title">{{ t('overview.versions') }}</h2>
                    <BarBreakdown
                        :items="overview.byVersion.map((v) => ({ label: v.launcherVersion || '?', count: v.count }))"
                    />
                </div>
                <div class="card">
                    <h2 class="section-title">{{ t('overview.os') }}</h2>
                    <BarBreakdown :items="overview.byOs.map((o) => ({ label: o.os || '?', count: o.count }))" />
                </div>
            </section>
        </template>
    </div>
</template>

<style scoped>
.page-title {
    font-size: 26px;
    margin: 0 0 24px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.grid.two {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.card {
    margin-bottom: 24px;
}

.card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.range-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg-elev-2);
    border-radius: 8px;
    padding: 4px;
}

.range-tab {
    border: none;
    background: transparent;
    color: var(--text-dim);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
}

.range-tab.active {
    background: var(--accent);
    color: #fff;
}

.muted {
    color: var(--text-dim);
}

.error {
    color: var(--red);
}
</style>
