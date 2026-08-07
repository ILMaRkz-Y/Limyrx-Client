import CurseforgeIcon from '@/components/CurseforgeIcon.vue'
import FTBIcon from '@/components/FTBIcon.vue'
import ImageIcon from '@/components/ImageIcon.vue'
import JarFileIcon from '@/components/JarFileIcon.vue'
import ModrinthIcon from '@/components/ModrinthIcon.vue'
import PackageFileIcon from '@/components/PackageFileIcon.vue'
import ZipFileIcon from '@/components/ZipFileIcon.vue'
import { generateM3Scheme, generateM3SchemeLight, schemeToVuetifyColors } from '@/composables/m3Color'
import { h } from 'vue'
import { IconProps, IconSet, createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
import { ar, ru, zhHans } from 'vuetify/locale'
import 'vuetify/styles'
import { BuiltinImages } from './constant'

const limyrx: IconSet = {
  component: (props: IconProps) => {
    switch (props.icon) {
      case 'ftb': return h(FTBIcon)
      case 'curseforge': return h(CurseforgeIcon)
      case 'zip': return h(ZipFileIcon)
      case 'jar': return h(JarFileIcon)
      case 'package': return h(PackageFileIcon)
      case 'modrinth': return h(ModrinthIcon)
      case 'forge': return h(ImageIcon, { src: BuiltinImages.forge })
      case 'fabric': return h(ImageIcon, { src: BuiltinImages.fabric })
      case 'quilt': return h(ImageIcon, { src: BuiltinImages.quilt })
      case 'minecraft': return h(ImageIcon, { src: BuiltinImages.minecraft })
      case 'prism': return h(ImageIcon, { src: BuiltinImages.prism })
      case 'neoForged': return h(ImageIcon, { src: BuiltinImages.neoForged })
      case 'optifine': return h(ImageIcon, { src: BuiltinImages.optifine })
      case 'iris': return h(ImageIcon, { src: BuiltinImages.iris })
      case 'oculus': return h(ImageIcon, { src: BuiltinImages.oculus })
      case 'mmc': return h(ImageIcon, { src: BuiltinImages.mmc })
      default: return null
    }
  },
}

// Generate M3 color schemes from the default seed color (#4caf50 — Minecraft grass green)
const defaultSeed = '#4caf50'
const darkScheme = generateM3Scheme(defaultSeed)
const lightScheme = generateM3SchemeLight(defaultSeed)

export const vuetify = createVuetify({
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { zhHans, ru, ar },
    rtl: {
      ar: true,
    },
  },
  icons: {
    defaultSet: 'md',
    aliases,
    sets: { md, limyrx },
  },
  defaults: {
    VSwitch: {
      inset: true,
      color: 'primary',
    },
    VCard: {
      rounded: 'lg',
    },
    VBtn: {
      rounded: 'lg',
    },
    VChip: {
      rounded: 'sm',
    },
    VSheet: {
      rounded: 'lg',
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: schemeToVuetifyColors(lightScheme),
      },
      system: {
        dark: true,
        colors: schemeToVuetifyColors(darkScheme),
      },
      dark: {
        dark: true,
        colors: schemeToVuetifyColors(darkScheme),
      },
    },
  },
})

/**
 * Update the Vuetify theme with a new seed color.
 * Call this when the user changes their primary color or
 * when a new instance icon is loaded.
 */
export function updateM3Theme(seedColor: string) {
  const dark = generateM3Scheme(seedColor)
  const light = generateM3SchemeLight(seedColor)

  const darkColors = schemeToVuetifyColors(dark)
  const lightColors = schemeToVuetifyColors(light)

  // Update both themes
  Object.assign(vuetify.theme.themes.value.dark.colors, darkColors)
  Object.assign(vuetify.theme.themes.value.light.colors, lightColors)
  Object.assign(vuetify.theme.themes.value.system.colors, darkColors)
}

// Export scheme generators for use in composables
export { generateM3Scheme, generateM3SchemeLight, schemeToVuetifyColors }
