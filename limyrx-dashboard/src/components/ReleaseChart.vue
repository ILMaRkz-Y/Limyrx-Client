<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { ReleaseDownloads } from '../types'

const props = defineProps<{
    releases: ReleaseDownloads[]
}>()

const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function render(): void {
    if (!chart) return
    const items = props.releases
        .slice()
        .sort((a, b) => a.totalDownloads - b.totalDownloads)
        .slice(-12)
    const max = Math.max(0, ...items.map((r) => r.totalDownloads))
    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#1a1f2b',
            borderColor: '#232a3a',
            textStyle: { color: '#e6e9f0' },
            formatter: (params) => {
                const list = Array.isArray(params) ? params : [params]
                return list
                    .map((p) => `${(p as { name: string }).name}: <b>${(p as { value: number }).value.toLocaleString()}</b>`)
                    .join('<br/>')
            },
        },
        grid: { left: 48, right: 16, top: 20, bottom: 48 },
        xAxis: {
            type: 'category',
            data: items.map((r) => r.tag),
            axisLabel: { color: '#9aa3b5', rotate: 35 },
            axisLine: { lineStyle: { color: '#232a3a' } },
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: { lineStyle: { color: '#1a1f2b' } },
            axisLabel: { color: '#9aa3b5' },
        },
        series: [
            {
                type: 'bar',
                data: items.map((r) => ({
                    value: r.totalDownloads,
                    itemStyle: {
                        color:
                            r.totalDownloads === max && max > 0
                                ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                      { offset: 0, color: '#22d3ee' },
                                      { offset: 1, color: '#0ea5a4' },
                                  ])
                                : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                      { offset: 0, color: '#7c6cff' },
                                      { offset: 1, color: '#4c3fd4' },
                                  ]),
                    },
                })),
                barMaxWidth: 44,
                itemStyle: { borderRadius: [6, 6, 0, 0] },
            },
        ],
    }
    chart.setOption(option, true)
}

onMounted(() => {
    if (!el.value) return
    chart = echarts.init(el.value)
    render()
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(el.value)
})

watch(() => props.releases, render)

onBeforeUnmount(() => {
    observer?.disconnect()
    chart?.dispose()
    chart = null
})
</script>

<template>
    <div ref="el" class="chart"></div>
</template>

<style scoped>
.chart {
    width: 100%;
    height: 280px;
}
</style>