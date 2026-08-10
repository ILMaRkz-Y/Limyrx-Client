<script setup lang="ts">
defineProps<{
    label: string
    value: string | number
    hint?: string
    tone?: 'accent' | 'green' | 'cyan'
}>()
</script>

<template>
    <div class="stat-card">
        <div class="stat-label">{{ label }}</div>
        <div class="stat-value" :class="tone ?? 'accent'">{{ value }}</div>
        <div v-if="hint" class="stat-hint">{{ hint }}</div>
    </div>
</template>

<style scoped>
.stat-card {
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.stat-label {
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 500;
}

.stat-value {
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
}

.stat-hint {
    color: var(--text-dim);
    font-size: 12px;
}

.accent {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.green {
    color: var(--green);
}

.cyan {
    color: var(--accent-2);
}
</style>
