<template>
  <div class="stepper-footer-root">
    <button
      data-testid="add-instance-cancel"
      class="stepper-btn stepper-btn--ghost"
      :disabled="creating"
      @click="emit('quit')"
    >
      {{ t('shared.cancel') }}
    </button>
    <div class="flex-1" />
    <slot />
    <button
      v-if="next"
      data-testid="add-instance-next"
      class="stepper-btn stepper-btn--primary"
      :disabled="disabled || creating"
      @click="emit('next')"
    >
      <span>{{ t('shared.next') }}</span>
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
    <button
      v-if="create"
      data-testid="add-instance-create"
      class="stepper-btn stepper-btn--primary stepper-btn--create"
      :disabled="disabled || creating"
      @click="emit('create')"
    >
      <svg v-if="creating" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>{{ creating ? t('loading') : t('create') }}</span>
    </button>
  </div>
</template>

<script lang=ts setup>

defineProps<{
  disabled: boolean
  creating: boolean
  create?: boolean
  next?: boolean
}>()

const emit = defineEmits(['quit', 'next', 'create', 'back'])
const { t } = useI18n()
</script>

<style scoped>
.stepper-footer-root {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stepper-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.stepper-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.15);
}

.stepper-btn--primary {
  background: rgba(76, 175, 80, 0.25);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.stepper-btn--primary:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.35);
  border-color: rgba(76, 175, 80, 0.4);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.15);
}

.stepper-btn--create {
  background: rgba(76, 175, 80, 0.3);
  color: #fff;
  border-color: rgba(76, 175, 80, 0.3);
}

.stepper-btn--create:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.5);
  border-color: rgba(76, 175, 80, 0.5);
  box-shadow: 0 0 25px rgba(76, 175, 80, 0.3);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
