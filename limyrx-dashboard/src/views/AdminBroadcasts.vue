<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createBroadcast, getBroadcasts } from '../api'
import type { Broadcast } from '../types'

const { t } = useI18n()

const broadcasts = ref<Broadcast[]>([])
const error = ref('')
const loading = ref(true)

const message = ref('')
const targetVersion = ref('')
const active = ref(true)
const creating = ref(false)
const created = ref(false)

async function load(): Promise<void> {
    error.value = ''
    loading.value = true
    try {
        broadcasts.value = await getBroadcasts()
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    } finally {
        loading.value = false
    }
}

async function submit(): Promise<void> {
    if (!message.value.trim()) {
        return
    }
    creating.value = true
    created.value = false
    try {
        await createBroadcast(message.value.trim(), targetVersion.value.trim() || null, active.value)
        message.value = ''
        targetVersion.value = ''
        active.value = true
        created.value = true
        await load()
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
    } finally {
        creating.value = false
    }
}

function fmt(iso: string): string {
    return new Date(iso).toLocaleString()
}

onMounted(load)
</script>

<template>
    <div class="page">
        <h1 class="page-title">{{ t('broadcasts.title') }}</h1>

        <div v-if="loading" class="muted">{{ t('common.loading') }}</div>
        <div v-else-if="error" class="error">
            {{ t('common.error') }}: {{ error }}
            <button class="btn" type="button" @click="load">{{ t('common.retry') }}</button>
        </div>
        <template v-else>
            <section class="card form-card">
                <h2 class="section-title">{{ t('broadcasts.new') }}</h2>
                <form class="form" @submit.prevent="submit">
                    <label class="field">
                        <span>{{ t('broadcasts.message') }}</span>
                        <input v-model="message" class="input" type="text" required />
                    </label>
                    <label class="field">
                        <span>{{ t('broadcasts.targetVersion') }}</span>
                        <input v-model="targetVersion" class="input" type="text" :placeholder="t('broadcasts.allVersions')" />
                    </label>
                    <label class="check">
                        <input v-model="active" type="checkbox" />
                        <span>{{ t('broadcasts.active') }}</span>
                    </label>
                    <button class="btn" type="submit" :disabled="creating || !message.trim()">
                        {{ t('broadcasts.create') }}
                    </button>
                    <p v-if="created" class="ok">{{ t('broadcasts.created') }}</p>
                </form>
            </section>

            <section class="card">
                <template v-if="broadcasts.length">
                    <article v-for="b in broadcasts" :key="b._id" class="item">
                        <div class="item-head">
                            <span class="status" :class="{ off: !b.active }">{{ b.active ? '●' : '○' }}</span>
                            <span class="target">{{ b.targetVersion ?? t('broadcasts.allVersions') }}</span>
                            <span class="time">{{ fmt(b.createdAt) }}</span>
                        </div>
                        <p class="item-message">{{ b.message }}</p>
                    </article>
                </template>
                <p v-else class="muted">{{ t('broadcasts.empty') }}</p>
            </section>
        </template>
    </div>
</template>

<style scoped>
.page-title {
    font-size: 26px;
    margin: 0 0 24px;
}

.form-card {
    margin-bottom: 24px;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 480px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--text-dim);
}

.check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.ok {
    color: var(--green);
    margin: 0;
    font-size: 13px;
}

.item {
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
}

.item:last-child {
    border-bottom: none;
}

.item-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
}

.status {
    color: var(--green);
}

.status.off {
    color: var(--text-dim);
}

.target {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent-2);
}

.time {
    margin-left: auto;
    color: var(--text-dim);
    font-size: 12px;
}

.item-message {
    margin: 0;
    font-size: 14px;
}

.muted {
    color: var(--text-dim);
}

.error {
    color: var(--red);
}
</style>
