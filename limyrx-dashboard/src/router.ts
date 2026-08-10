import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from './api'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'public',
            component: () => import('./views/PublicOverview.vue'),
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('./views/LoginView.vue'),
        },
        {
            path: '/admin',
            name: 'admin',
            component: () => import('./views/AdminOverview.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/admin/players',
            name: 'players',
            component: () => import('./views/AdminPlayers.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/admin/broadcasts',
            name: 'broadcasts',
            component: () => import('./views/AdminBroadcasts.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/',
        },
    ],
})

router.beforeEach((to) => {
    if (to.meta.requiresAuth && !getToken()) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.name === 'login' && getToken()) {
        return { name: 'admin' }
    }
    return true
})

export default router
