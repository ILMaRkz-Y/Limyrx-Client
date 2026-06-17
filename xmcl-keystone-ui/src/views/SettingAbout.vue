<template>
  <section class="about">
    <SettingCard>
      <div>
        <v-card-item>
          <v-card-title class="w-full flex mr-2 title">
          <v-img src="http://launcher/icons/logoDark" alt="Limyrx Logo" max-width="64" class="mr-4"></v-img>
          <div>
            <a class="text-h5" href="https://limyrx.xyz" v-shared-tooltip="() => 'Limyrx Launcher'">Limyrx Launcher</a>
            <div class="flex justify-center items-center gap-2 pt-1">
            </div>
          </div>
          <v-spacer />
          <div>
            <div class="flex items-center justify-center flex-grow-0 gap-2">
              <v-icon color="primary" aria-hidden="true">verified</v-icon>
              <div class="text-caption">{{ t('setting.aboutLicense') }}</div>
            </div>
          </div>
        </v-card-title>
        </v-card-item>

        <v-textarea
          filled
          readonly
          class="px-4"
          :value="debugInfo"
          :label="t('setting.about')"
          :aria-label="t('setting.about')"
        />
      </div>
    </SettingCard>
  </section>
</template>

<script lang="ts" setup>
import SettingCard from '@/components/SettingCard.vue'
import { kEnvironment } from '@/composables/environment'
import { kFlights } from '@/composables/flights'
import { vSharedTooltip } from '@/directives/sharedTooltip'
import { injection } from '@/util/inject'

const env = injection(kEnvironment)
const flights = injection(kFlights)

const debugInfo = computed(() => {
  return JSON.stringify({ ...env.value, flights }, null, 2)
})

const { t } = useI18n()


</script>
<style scoped>

</style>
