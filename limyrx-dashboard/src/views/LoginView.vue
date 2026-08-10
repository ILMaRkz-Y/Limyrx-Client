<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { login, setSession } from '../api'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit(): Promise<void> {
    error.value = ''
    busy.value = true
    try {
        const result = await login(email.value.trim(), password.value)
        setSession(result.token, result.admin.email)
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
        await router.push(redirect)
    } catch (err) {
        error.value = t('login.invalid')
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="login-wrap">
        <form class="card login-card" @submit.prevent="submit">
            <h1 class="title">{{ t('login.title') }}</h1>
            <label class="field">
                <span>{{ t('login.email') }}</span>
                <input v-model="email" class="input" type="email" autocomplete="username" required />
            </label>
            <label class="field">
                <span>{{ t('login.password') }}</span>
                <input v-model="password" class="input" type="password" autocomplete="current-password" required />
            </label>
            <p v-if="error" class="error">{{ error }}</p>
            <button class="btn" type="submit" :disabled="busy">
                {{ t('common.signIn') }}
            </button>
        </form>
    </div>
</template>

<style scoped>
.login-wrap {
    display: flex;
    justify-content: center;
    padding-top: 10vh;
}

.login-card {
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.title {
    font-size: 20px;
    margin: 0;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--text-dim);
}

.error {
    color: var(--red);
    margin: 0;
    font-size: 13px;
}
</style>
