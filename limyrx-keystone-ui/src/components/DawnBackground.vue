<template>
  <div
    class="dawn-bg"
    aria-hidden="true"
    style="position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;"
  >
    <!-- Layer 0: Sky / rear -->
    <img
      :src="rear" alt="" draggable="false"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;image-rendering:pixelated;pointer-events:none;display:block;z-index:0;"
    />

    <!-- Layer 1: Animated sea -->
    <img
      :src="sea" alt="" draggable="false"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;image-rendering:pixelated;pointer-events:none;display:block;z-index:1;"
    />

    <!-- Layer 2: Foreground grass -->
    <img
      :src="foreground" alt="" draggable="false"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;image-rendering:pixelated;pointer-events:none;display:block;z-index:2;"
    />

    <!-- Layer 3: Flower animation -->
    <img
      :src="flowers" alt="" draggable="false"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;image-rendering:pixelated;pointer-events:none;display:block;z-index:3;"
    />

    <!-- Bee 1: Large, slow -->
    <div style="position:absolute;z-index:4;pointer-events:none;will-change:transform;top:26%;animation:bee-drift 38s linear 0s infinite;">
      <div style="animation:bee-bob 6.3s ease-in-out infinite;">
        <img :src="bee1" alt="" width="168" height="168" draggable="false" style="image-rendering:pixelated;display:block;"/>
      </div>
    </div>

    <!-- Bee 2: Medium, flipped -->
    <div style="position:absolute;z-index:4;pointer-events:none;will-change:transform;top:48%;animation:bee-drift 46s linear -8s infinite;">
      <div style="animation:bee-bob2 7.7s ease-in-out infinite;">
        <img :src="bee2" alt="" width="144" height="144" draggable="false" style="image-rendering:pixelated;display:block;transform:scaleX(-1);"/>
      </div>
    </div>

    <!-- Bee 3: Small, faded -->
    <div style="position:absolute;z-index:4;pointer-events:none;will-change:transform;top:18%;animation:bee-drift2 32s linear -18s infinite;opacity:0.75;">
      <div style="animation:bee-bob3 5.3s ease-in-out infinite;">
        <img :src="bee1" alt="" width="120" height="120" draggable="false" style="image-rendering:pixelated;display:block;"/>
      </div>
    </div>

    <!-- Center-darken overlay -->
    <div style="position:absolute;inset:0;z-index:5;pointer-events:none;background:radial-gradient(ellipse 90% 60% at 50% 45%,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.35) 35%,rgba(0,0,0,0) 75%);"></div>
  </div>
</template>

<script lang="ts" setup>
import rear from '@/assets/dawn/rear.png'
import sea from '@/assets/dawn/sea-anim.webp'
import foreground from '@/assets/dawn/foreground.png'
import flowers from '@/assets/dawn/flower-anim.webp'
import bee1 from '@/assets/dawn/bee1.webp'
import bee2 from '@/assets/dawn/bee2.webp'
</script>

<style>
/* Unscoped — animations must escape Vue scoping to work */
@keyframes bee-drift {
  0%   { transform: translateX(-12vw); }
  100% { transform: translateX(112vw); }
}
@keyframes bee-drift2 {
  0%   { transform: translateX(-12vw); }
  100% { transform: translateX(112vw); }
}
@keyframes bee-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(18px); }
}
@keyframes bee-bob2 {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(14px); }
}
@keyframes bee-bob3 {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(12px); }
}
</style>
