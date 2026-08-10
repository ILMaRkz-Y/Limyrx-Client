<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPlayers } from '../api'
import type { PlayersResponse } from '../types'

const { t } = useI18n()

const data = ref<PlayersResponse | null>(null)
const q = ref('')
const sort = ref<'lastSeen' | 'firstSeen'>('lastSeen')
const offset = ref(0)
const limit = 50
const error = ref('')
const loading = ref(true)

async function load(): Promise<void> {
    error.value = ''
    loading.value = true
    try {
        data.value = await getPlayers(q.value.trim(), sort.value, limit, offset.value)
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    } finally {
        loading.value = false
    }
}

let debounce: number | undefined
function onSearch(): void {
    window.clearTimeout(debounce)
    offset.value = 0
    debounce = window.setTimeout(() => void load(), 350)
}

function setSort(next: 'lastSeen' | 'firstSeen'): void {
    sort.value = next
    offset.value = 0
    void load()
}

function prev(): void {
    offset.value = Math.max(0, offset.value - limit)
    void load()
}

function next(): void {
    if (data.value && offset.value + limit < data.value.total) {
        offset.value += limit
        void load()
    }
}

function fmt(iso: string): string {
    return new Date(iso).toLocaleString()
}

onMounted(load)
</script>

<template>
    <div class="page">
        <h1 class="page-title">{{ t('players.title') }}</h1>

        <div class="controls">
            <input v-model="q" class="input search" type="search" :placeholder="t('players.search')" @input="onSearch" />
            <div class="sort-tabs">
                <button
                    type="button"
                    class="sort-tab"
                    :class="{ active: sort === 'lastSeen' }"
                    @click="setSort('lastSeen')"
                >
                    {{ t('players.lastSeen') }}
                </button>
                <button
                    type="button"
                    class="sort-tab"
                    :class="{ active: sort === 'firstSeen' }"
                    @click="setSort('firstSeen')"
                >
                    {{ t('players.firstSeen') }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="muted">{{ t('common.loading') }}</div>
        <div v-else-if="error" class="error">
            {{ t('common.error') }}: {{ error }}
            <button class="btn" type="button" @click="load">{{ t('common.retry') }}</button>
        </div>
        <section v-else-if="data" class="card table-card">
            <p class="count">
                {{ data.total.toLocaleString() }} {{ t('players.of') }}
            </p>
            <template v-if="data.players.length">
                <table>
                    <thead>
                        <tr>
                            <th>{{ t('players.username') }}</th>
                            <th>{{ t('players.firstSeen') }}</th>
                            <th>{{ t('players.lastSeen') }}</th>
                            <th class="num">{{ t('players.devices') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="player in data.players" :key="player._id">
                            <td class="user">{{ player.username }}</td>
                            <td>{{ fmt(player.firstSeen) }}</td>
                            <td>{{ fmt(player.lastSeen) }}</td>
                            <td class="num">{{ player.deviceIds.length }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="pager">
                    <button class="btn btn-ghost" type="button" :disabled="offset === 0" @click="prev">‹</button>
                    <span class="page-info">{{ offset / limit + 1 }} / {{ Math.max(1, Math.ceil(data.total / limit)) }}</span>
                    <button class="btn btn-ghost" type="button" :disabled="offset + limit >= data.total" @click="next">›</button>
                </div>
            </template>
            <p v-else class="muted">{{ t('players.noResults') }}</p>
        </section>
    </div>
</template>

<style scoped>
.page-title {
    font-size: 26px;
    margin: 0 0 24px;
}

.controls {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 20px;
}

.search {
    max-width: 320px;
}

.sort-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg-elev-2);
    border-radius: 8px;
    padding: 4px;
}

.sort-tab {
    border: none;
    background: transparent;
    color: var(--text-dim);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
}

.sort-tab.active {
    background: var(--accent);
    color: #fff;
}

.table-card {
    padding: 0;
    overflow: hidden;
}

.count {
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    color: var(--text-dim);
    font-size: 13px;
}

.user {
    font-weight: 600;
}

.num {
    text-align: right;
}

.pager {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
}

.page-info {
    color: var(--text-dim);
    font-size: 13px;
}

.muted {
    color: var(--text-dim);
}

.error {
    color: var(--red);
}
</style>
