<script setup lang="ts">
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const checked = ref(false);
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const handleLogin = async () => {
    if (!email.value || !password.value) {
        toast.add({ severity: 'warn', summary: 'Validasi Gagal', detail: 'Silakan masukkan email dan kata sandi Anda', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        await authStore.login(email.value, password.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Login berhasil, selamat datang!', life: 2000 });
        router.push('/');
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Login gagal. Periksa kembali kredensial Anda.';
        toast.add({ severity: 'error', summary: 'Login Gagal', detail: errorMsg, life: 4000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />
    <Toast />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-4">SeliPOS</div>
                        <span class="text-muted-color font-medium">Masuk ke akun Anda untuk melanjutkan</span>
                    </div>

                    <form @submit.prevent="handleLogin">
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="email" placeholder="Alamat email" class="w-full md:w-[30rem] mb-8" v-model="email" :disabled="loading" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Kata Sandi</label>
                        <Password id="password1" v-model="password" placeholder="Kata Sandi" :toggleMask="true" class="mb-4" fluid :feedback="false" :disabled="loading"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Ingat saya</label>
                            </div>
                            <!-- <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Lupa kata sandi?</span> -->
                        </div>
                        <Button type="submit" label="Masuk" class="w-full mb-4" :loading="loading"></Button>

                        <div class="text-center">
                            <span class="text-muted-color">Belum punya akun? </span>
                            <router-link to="/auth/register" class="font-medium text-primary no-underline cursor-pointer">Daftar</router-link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
