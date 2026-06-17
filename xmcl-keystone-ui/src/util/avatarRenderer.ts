/**
 * Render just the head (face + hat overlay) from a Minecraft skin texture.
 */
export function renderMinecraftPlayerTextHead(textureUrl: string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = textureUrl
  return new Promise<string>((resolve, reject) => {
    img.onload = () => {
      canvas.width = 8
      canvas.height = 8
      // Draw head (front)
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 8, 8)
      // Draw head overlay (front)
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 8, 8)
      resolve(canvas.toDataURL())
    }
    img.onerror = reject
  })
}

/**
 * Render a Minecraft cape as a nice 2D preview image.
 * Draws the cape texture mapped onto a cape shape (wider at top, tapered bottom, curved hem)
 * as it would appear from behind, with subtle shading for depth.
 */
export function renderMinecraftCape(capeUrl: string, scale = 4): Promise<string> | undefined {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = capeUrl

  return new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const texW = img.naturalWidth
      const texH = img.naturalHeight

      // The cape design is in the bottom half of the 64x32 texture
      const cropY = texH > 16 ? Math.floor(texH / 2) : 0
      const srcW = texW
      const srcH = texH - cropY

      // Cape shape dimensions (in game-pixel units):
      //   Top width: 10 px, Bottom width: 11 px, Height: 16 px
      //   plus a small curved hem at bottom
      const topW = 10
      const botW = 11
      const bodyH = 16
      const hemH = 2
      const totalH = bodyH + hemH

      // Output canvas (with 2px padding on each side for shoulder tabs)
      const pad = 2
      const outW = (botW + pad * 2) * scale
      const outH = (totalH + pad) * scale

      canvas.width = outW
      canvas.height = outH

      ctx.imageSmoothingEnabled = false

      // ── 1. Draw the cape texture onto a temp canvas ──
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = texW
      tempCanvas.height = texH
      const tempCtx = tempCanvas.getContext('2d')!
      tempCtx.drawImage(img, 0, 0)
      const imageData = tempCtx.getImageData(0, cropY, srcW, srcH)
      const pixels = imageData.data

      // ── 2. Build the cape shape pixel-by-pixel ──
      for (let y = 0; y < totalH; y++) {
        // Width at this row
        let rowW: number
        if (y < bodyH) {
          rowW = topW + (botW - topW) * (y / bodyH)
        } else {
          // Hem: curve inward
          const t = (y - bodyH) / hemH
          rowW = botW * (1 - t * 0.4)
        }

        const halfDiff = (botW - rowW) / 2
        const leftX = pad + halfDiff
        const rowPixels = Math.ceil(rowW)

        // Source row in the cape texture
        const srcY = Math.min(srcH - 1, Math.floor((y / totalH) * srcH))

        for (let px = 0; px < rowPixels; px++) {
          const x = Math.floor(leftX) + px
          // Map to source texture
          const progress = rowPixels > 1 ? px / (rowPixels - 1) : 0.5
          const srcX = Math.floor(progress * (srcW - 1))

          // Get pixel color from source
          const si = (srcY * srcW + srcX) * 4
          const r = pixels[si]
          const g = pixels[si + 1]
          const b = pixels[si + 2]
          const a = pixels[si + 3]

          // Apply shading (left side darker, right side brighter)
          const shadeProgress = rowPixels > 1 ? px / (rowPixels - 1) : 0.5
          const shade = 0.85 + shadeProgress * 0.25 // 0.85 to 1.10

          ctx.fillStyle = `rgba(${Math.floor(r * shade)},${Math.floor(g * shade)},${Math.floor(b * shade)},${a / 255})`
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }

      // ── 3. Outline ──
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      for (let y = 0; y < totalH; y++) {
        let rowW: number
        if (y < bodyH) {
          rowW = topW + (botW - topW) * (y / bodyH)
        } else {
          const t = (y - bodyH) / hemH
          rowW = botW * (1 - t * 0.4)
        }
        const halfDiff = (botW - rowW) / 2
        const leftX = pad + halfDiff
        const rightX = leftX + rowW - 1

        const ly = y * scale
        const lx = Math.floor(leftX) * scale + 0.5
        const rx = Math.ceil(rightX) * scale - 0.5

        if (y > 0) {
          ctx.beginPath()
          ctx.moveTo(lx, ly)
          ctx.lineTo(lx, ly + scale)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(rx, ly)
          ctx.lineTo(rx, ly + scale)
          ctx.stroke()
        }
      }

      resolve(canvas.toDataURL())
    }
    img.onerror = reject
  })
}

/**
 * Render a full character "bust" (head + body + arms) from a Minecraft skin texture.
 * This gives a nice 2D paper-doll preview of the uploaded skin.
 * Works with both 64x32 (old) and 64x64 (modern) skin formats.
 * Scale factor controls the output size (default 4 = 32x... canvas).
 */
export function renderMinecraftPlayerCharacter(textureUrl: string, scale = 4): Promise<string> | undefined {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = textureUrl

  return new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const texW = img.naturalWidth  // 64 for standard skins
      const texH = img.naturalHeight // 32 or 64

      // Output dimensions: 16 wide (head 8 + arm 4 + body 8 + arm 4, centered) x 20 tall (head 8 + body 12)
      // Actually:  body(8) + left_arm(4) on left side + right_arm(4) on right side = 16 wide
      // Height: head(8) + body(12) = 20
      const outputW = 16
      const outputH = 20

      canvas.width = outputW * scale
      canvas.height = outputH * scale

      ctx.imageSmoothingEnabled = false
      ctx.scale(scale, scale)

      // ── Head (front) ──
      // Head is at (8, 8) size 8x8
      ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8)
      // Head overlay/hat (front) is at (40, 8) size 8x8
      ctx.drawImage(img, 40, 8, 8, 8, 4, 0, 8, 8)

      // ── Body / Torso (front) ──
      // Body is at (20, 20) size 8x12 on both 64x32 and 64x64
      ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12)
      // Jacket overlay (front) is at (20, 36) size 8x12 (only for 64x64)
      if (texH >= 64) {
        ctx.drawImage(img, 20, 36, 8, 12, 4, 8, 8, 12)
      }

      // ── Left Arm (front) ──
      // Left arm is at (44, 20) size 4x12 on both 64x32 and 64x64
      // Position it at x=0
      ctx.drawImage(img, 44, 20, 4, 12, 0, 8, 4, 12)
      // Left arm overlay (front) at (44, 36) size 4x12 (64x64 only)
      if (texH >= 64) {
        ctx.drawImage(img, 44, 36, 4, 12, 0, 8, 4, 12)
      }

      // ── Right Arm (front) ──
      // For 64x64: right arm front is at (36, 52) size 4x12
      // For 64x32: right arm is mirrored from left arm? No, right arm isn't stored in 64x32 format
      if (texH >= 64) {
        ctx.drawImage(img, 36, 52, 4, 12, 12, 8, 4, 12)
        // Right arm overlay (front) at (52, 52) size 4x12
        if (texH >= 64) {
          ctx.drawImage(img, 52, 52, 4, 12, 12, 8, 4, 12)
        }
      } else {
        // 64x32 format: mirror left arm for right arm
        // Flip horizontally by drawing with negative width
        ctx.save()
        ctx.translate(16, 8)
        ctx.scale(-1, 1)
        ctx.drawImage(img, 44, 20, 4, 12, 0, 0, 4, 12)
        ctx.restore()
      }

      resolve(canvas.toDataURL())
    }
    img.onerror = reject
  })
}
