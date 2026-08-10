<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    items: Array<{ label: string; count: number }>
}>()

const max = computed(() => Math.max(1, ...props.items.map((i) => i.count)))
</script>

<template>
    <div class="bars">
        <div v-for="item in items" :key="item.label" class="bar-row">
            <span class="bar-label" :title="item.label">{{ item.label }}</span>
            <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${(item.count / max) * 100}%` }"></div>
            </div>
            <span class="bar-count">{{ item.count }}</span>
        </div>
        <div v-if="items.length === 0" class="empty">—</div>
    </div>
</template>

<style scoped>
.bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.bar-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.bar-label {
    width: 140px;
    flex-shrink: 0;
    color: var(--text-dim);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bar-track {
    flex: 1;
    height: 8px;
    background: var(--bg-elev-2);
    border-radius: 4px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
    transition: width 0.4s ease;
}

.bar-count {
    width: 40px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
}

.empty {
    color: var(--text-dim);
    font-size: 13px;
}
</style>
