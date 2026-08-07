/**
 * Material You (M3) Dynamic Color Generator
 *
 * Generates a full M3 tonal palette from a seed color.
 * This is a self-contained implementation — no external dependencies.
 *
 * Based on the M3 color system specification:
 * https://m3.material.io/styles/color/system
 */

// ── Color space conversions ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
}

// sRGB → HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

// HSL → sRGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

// ── Tonal palette generation ──

/**
 * M3 tonal palette tones.
 * Each tone is a number from 0 (black) to 100 (white).
 */
export type TonalPalette = Record<number, string>

/**
 * Generate a tonal palette from a hue, chroma, and tone.
 * Uses HCT-like approach with HSL for simplicity.
 */
function createTonalPalette(
  hue: number,
  chroma: number,
  baseLightness: number = 50,
): TonalPalette {
  const tones: TonalPalette = {}
  for (const tone of [0, 4, 6, 10, 12, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100]) {
    // Map M3 tone to lightness
    const l = tone / 100
    // Reduce chroma at extremes (near black and white)
    const chromaFactor = l < 0.2 ? l / 0.2 : l > 0.8 ? (1 - l) / 0.2 : 1
    const s = Math.min(1, (chroma / 100) * chromaFactor)
    const [r, g, b] = hslToRgb(hue, s, l)
    tones[tone] = rgbToHex(r, g, b)
  }
  return tones
}

// ── M3 Scheme generation ──

export interface M3Scheme {
  // Primary
  primary: string
  primaryContainer: string
  onPrimary: string
  onPrimaryContainer: string
  primaryFixed: string
  primaryFixedDim: string
  onPrimaryFixed: string
  onPrimaryFixedVariant: string

  // Secondary
  secondary: string
  secondaryContainer: string
  onSecondary: string
  onSecondaryContainer: string
  secondaryFixed: string
  secondaryFixedDim: string
  onSecondaryFixed: string
  onSecondaryFixedVariant: string

  // Tertiary
  tertiary: string
  tertiaryContainer: string
  onTertiary: string
  onTertiaryContainer: string
  tertiaryFixed: string
  tertiaryFixedDim: string
  onTertiaryFixed: string
  onTertiaryFixedVariant: string

  // Error
  error: string
  errorContainer: string
  onError: string
  onErrorContainer: string

  // Surface
  surface: string
  surfaceDim: string
  surfaceBright: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
  onSurface: string
  onSurfaceVariant: string
  inverseSurface: string
  inverseOnSurface: string
  surfaceTint: string

  // Outline
  outline: string
  outlineVariant: string

  // Background
  background: string
  onBackground: string

  // Scrim & shadow
  scrim: string
  shadow: string
}

function pickFromPalette(palette: TonalPalette, tone: number): string {
  // Find closest available tone
  const keys = Object.keys(palette).map(Number).sort((a, b) => a - b)
  let closest = keys[0]
  for (const k of keys) {
    if (Math.abs(k - tone) < Math.abs(closest - tone)) {
      closest = k
    }
  }
  return palette[closest]
}

export function generateM3Scheme(seedHex: string): M3Scheme {
  const [r, g, b] = hexToRgb(seedHex)
  const [hue, sat] = rgbToHsl(r, g, b)

  // Derive three palettes from the seed:
  // Primary: the seed color
  // Secondary: desaturated version
  // Tertiary: shifted hue (+60°)
  const primaryPalette = createTonalPalette(hue, sat * 100)
  const secondaryPalette = createTonalPalette(hue, sat * 36)
  const tertiaryPalette = createTonalPalette((hue + 60) % 360, sat * 60)
  const neutralPalette = createTonalPalette(hue, sat * 8)
  const neutralVariantPalette = createTonalPalette(hue, sat * 14)
  const errorPalette = createTonalPalette(25, 84) // Red error

  return {
    // Primary
    primary: pickFromPalette(primaryPalette, 40),
    primaryContainer: pickFromPalette(primaryPalette, 90),
    onPrimary: pickFromPalette(primaryPalette, 100),
    onPrimaryContainer: pickFromPalette(primaryPalette, 10),
    primaryFixed: pickFromPalette(primaryPalette, 90),
    primaryFixedDim: pickFromPalette(primaryPalette, 80),
    onPrimaryFixed: pickFromPalette(primaryPalette, 10),
    onPrimaryFixedVariant: pickFromPalette(primaryPalette, 30),

    // Secondary
    secondary: pickFromPalette(secondaryPalette, 40),
    secondaryContainer: pickFromPalette(secondaryPalette, 90),
    onSecondary: pickFromPalette(secondaryPalette, 100),
    onSecondaryContainer: pickFromPalette(secondaryPalette, 10),
    secondaryFixed: pickFromPalette(secondaryPalette, 90),
    secondaryFixedDim: pickFromPalette(secondaryPalette, 80),
    onSecondaryFixed: pickFromPalette(secondaryPalette, 10),
    onSecondaryFixedVariant: pickFromPalette(secondaryPalette, 30),

    // Tertiary
    tertiary: pickFromPalette(tertiaryPalette, 40),
    tertiaryContainer: pickFromPalette(tertiaryPalette, 90),
    onTertiary: pickFromPalette(tertiaryPalette, 100),
    onTertiaryContainer: pickFromPalette(tertiaryPalette, 10),
    tertiaryFixed: pickFromPalette(tertiaryPalette, 90),
    tertiaryFixedDim: pickFromPalette(tertiaryPalette, 80),
    onTertiaryFixed: pickFromPalette(tertiaryPalette, 10),
    onTertiaryFixedVariant: pickFromPalette(tertiaryPalette, 30),

    // Error
    error: pickFromPalette(errorPalette, 40),
    errorContainer: pickFromPalette(errorPalette, 90),
    onError: pickFromPalette(errorPalette, 100),
    onErrorContainer: pickFromPalette(errorPalette, 10),

    // Surface (dark scheme)
    surface: pickFromPalette(neutralPalette, 6),
    surfaceDim: pickFromPalette(neutralPalette, 6),
    surfaceBright: pickFromPalette(neutralPalette, 24),
    surfaceContainerLowest: pickFromPalette(neutralPalette, 4),
    surfaceContainerLow: pickFromPalette(neutralPalette, 10),
    surfaceContainer: pickFromPalette(neutralPalette, 12),
    surfaceContainerHigh: pickFromPalette(neutralPalette, 17),
    surfaceContainerHighest: pickFromPalette(neutralPalette, 22),
    onSurface: pickFromPalette(neutralPalette, 90),
    onSurfaceVariant: pickFromPalette(neutralVariantPalette, 80),
    inverseSurface: pickFromPalette(neutralPalette, 90),
    inverseOnSurface: pickFromPalette(neutralPalette, 20),
    surfaceTint: pickFromPalette(primaryPalette, 40),

    // Outline
    outline: pickFromPalette(neutralVariantPalette, 60),
    outlineVariant: pickFromPalette(neutralVariantPalette, 30),

    // Background
    background: pickFromPalette(neutralPalette, 6),
    onBackground: pickFromPalette(neutralPalette, 90),

    // Scrim & shadow
    scrim: '#000000',
    shadow: '#000000',
  }
}

/**
 * Light variant of the M3 scheme (higher surface tones, swapped fg/bg).
 */
export function generateM3SchemeLight(seedHex: string): M3Scheme {
  const [r, g, b] = hexToRgb(seedHex)
  const [hue, sat] = rgbToHsl(r, g, b)

  const primaryPalette = createTonalPalette(hue, sat * 100)
  const secondaryPalette = createTonalPalette(hue, sat * 36)
  const tertiaryPalette = createTonalPalette((hue + 60) % 360, sat * 60)
  const neutralPalette = createTonalPalette(hue, sat * 8)
  const neutralVariantPalette = createTonalPalette(hue, sat * 14)
  const errorPalette = createTonalPalette(25, 84)

  return {
    // Primary
    primary: pickFromPalette(primaryPalette, 40),
    primaryContainer: pickFromPalette(primaryPalette, 90),
    onPrimary: pickFromPalette(primaryPalette, 100),
    onPrimaryContainer: pickFromPalette(primaryPalette, 10),
    primaryFixed: pickFromPalette(primaryPalette, 90),
    primaryFixedDim: pickFromPalette(primaryPalette, 80),
    onPrimaryFixed: pickFromPalette(primaryPalette, 10),
    onPrimaryFixedVariant: pickFromPalette(primaryPalette, 30),

    // Secondary
    secondary: pickFromPalette(secondaryPalette, 40),
    secondaryContainer: pickFromPalette(secondaryPalette, 80),
    onSecondary: pickFromPalette(secondaryPalette, 100),
    onSecondaryContainer: pickFromPalette(secondaryPalette, 10),
    secondaryFixed: pickFromPalette(secondaryPalette, 90),
    secondaryFixedDim: pickFromPalette(secondaryPalette, 80),
    onSecondaryFixed: pickFromPalette(secondaryPalette, 10),
    onSecondaryFixedVariant: pickFromPalette(secondaryPalette, 30),

    // Tertiary
    tertiary: pickFromPalette(tertiaryPalette, 40),
    tertiaryContainer: pickFromPalette(tertiaryPalette, 80),
    onTertiary: pickFromPalette(tertiaryPalette, 100),
    onTertiaryContainer: pickFromPalette(tertiaryPalette, 10),
    tertiaryFixed: pickFromPalette(tertiaryPalette, 90),
    tertiaryFixedDim: pickFromPalette(tertiaryPalette, 80),
    onTertiaryFixed: pickFromPalette(tertiaryPalette, 10),
    onTertiaryFixedVariant: pickFromPalette(tertiaryPalette, 30),

    // Error
    error: pickFromPalette(errorPalette, 40),
    errorContainer: pickFromPalette(errorPalette, 80),
    onError: pickFromPalette(errorPalette, 100),
    onErrorContainer: pickFromPalette(errorPalette, 10),

    // Surface (light scheme — higher tones)
    surface: pickFromPalette(neutralPalette, 98),
    surfaceDim: pickFromPalette(neutralPalette, 87),
    surfaceBright: pickFromPalette(neutralPalette, 98),
    surfaceContainerLowest: pickFromPalette(neutralPalette, 100),
    surfaceContainerLow: pickFromPalette(neutralPalette, 96),
    surfaceContainer: pickFromPalette(neutralPalette, 94),
    surfaceContainerHigh: pickFromPalette(neutralPalette, 92),
    surfaceContainerHighest: pickFromPalette(neutralPalette, 90),
    onSurface: pickFromPalette(neutralPalette, 10),
    onSurfaceVariant: pickFromPalette(neutralVariantPalette, 30),
    inverseSurface: pickFromPalette(neutralPalette, 20),
    inverseOnSurface: pickFromPalette(neutralPalette, 95),
    surfaceTint: pickFromPalette(primaryPalette, 40),

    // Outline
    outline: pickFromPalette(neutralVariantPalette, 50),
    outlineVariant: pickFromPalette(neutralVariantPalette, 80),

    // Background
    background: pickFromPalette(neutralPalette, 98),
    onBackground: pickFromPalette(neutralPalette, 10),

    // Scrim & shadow
    scrim: '#000000',
    shadow: '#000000',
  }
}

/**
 * Convert an M3 scheme to a CSS custom properties string
 * suitable for injection into :root.
 */
export function schemeToCSS(scheme: M3Scheme, prefix = '--md'): string {
  const entries = Object.entries(scheme)
  return entries.map(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    return `${prefix}-${cssVar}: ${value};`
  }).join('\n  ')
}

/**
 * Convert an M3 scheme to a Vuetify theme colors object.
 */
export function schemeToVuetifyColors(scheme: M3Scheme) {
  return {
    primary: scheme.primary,
    'on-primary': scheme.onPrimary,
    'primary-container': scheme.primaryContainer,
    'on-primary-container': scheme.onPrimaryContainer,
    secondary: scheme.secondary,
    'on-secondary': scheme.onSecondary,
    'secondary-container': scheme.secondaryContainer,
    'on-secondary-container': scheme.onSecondaryContainer,
    tertiary: scheme.tertiary,
    'on-tertiary': scheme.onTertiary,
    'tertiary-container': scheme.tertiaryContainer,
    'on-tertiary-container': scheme.onTertiaryContainer,
    error: scheme.error,
    'on-error': scheme.onError,
    'error-container': scheme.errorContainer,
    'on-error-container': scheme.onErrorContainer,
    surface: scheme.surface,
    'surface-bright': scheme.surfaceBright,
    'surface-dim': scheme.surfaceDim,
    'surface-container-lowest': scheme.surfaceContainerLowest,
    'surface-container-low': scheme.surfaceContainerLow,
    'surface-container': scheme.surfaceContainer,
    'surface-container-high': scheme.surfaceContainerHigh,
    'surface-container-highest': scheme.surfaceContainerHighest,
    'on-surface': scheme.onSurface,
    'on-surface-variant': scheme.onSurfaceVariant,
    'inverse-surface': scheme.inverseSurface,
    'inverse-on-surface': scheme.inverseOnSurface,
    'surface-tint': scheme.surfaceTint,
    outline: scheme.outline,
    'outline-variant': scheme.outlineVariant,
    background: scheme.background,
    'on-background': scheme.onBackground,
  }
}
