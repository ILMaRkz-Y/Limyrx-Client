<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useI18n } from 'vue-i18n'
import type { TimeseriesPoint } from '../types'

const props = defineProps<{
    points: TimeseriesPoint[]
    range: '24h' | '7d' | '30d'
}>()

const { t } = useI18n()
const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function labelAt(iso: string): string {
    const d = new Date(iso)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const md = `${d.getMonth() + 1}/${d.getDate()}`
    return props.range === '24h' ? `${hh}:${mm}` : md
}

function render(): void {
    if (!chart) {
        return
    }
    const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1f2b',
            borderColor: '#232a3a',
            textStyle: { color: '#e6e9f0' },
        },
        legend: {
            textStyle: { color: '#9aa3b5' },
            top: 0,
        },
        grid: { left: 48, right: 16, top: 36, bottom: 28 },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: props.points.map((p) => labelAt(p.at)),
            axisLine: { lineStyle: { color: '#232a3a' } },
            axisLabel: { color: '#9aa3b5' },
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: { lineStyle: { color: '#1a1f2b' } },
            axisLabel: { color: '#9aa3b5' },
        },
        series: [
            {
                name: t('overview.devices'),
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: props.points.map((p) => p.devices),
                lineStyle: { color: '#7c6cff', width: 2 },
                itemStyle: { color: '#7c6cff' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(124,108,255,0.35)' },
                        { offset: 1, color: 'rgba(124,108,255,0)' },
                    ]),
                },
            },
            {
                name: t('overview.events'),
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: props.points.map((p) => p.events),
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' },
            },
        ],
    }
    chart.setOption(option, true)
}

onMounted(() => {
    if (!el.value) {
        return
    }
    chart = echarts.init(el.value)
    render()
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(el.value)
})

watch(() => [props.points, props.range], render)

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
    height: 320px;
}
</style>
