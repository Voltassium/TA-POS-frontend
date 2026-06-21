<script setup lang="ts">
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useAuthStore } from '@/stores/authStore';
import { storeApi } from '@/api/storeApi';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const storeName = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const handleRegister = async () => {
    if (!email.value || !password.value || !confirmPassword.value || !storeName.value) {
        toast.add({ severity: 'warn', summary: 'Validasi Gagal', detail: 'Semua kolom wajib diisi', life: 3000 });
        return;
    }

    if (password.value !== confirmPassword.value) {
        toast.add({ severity: 'warn', summary: 'Validasi Gagal', detail: 'Kata sandi dan konfirmasi tidak cocok', life: 3000 });
        return;
    }

    if (password.value.length < 6) {
        toast.add({ severity: 'warn', summary: 'Validasi Gagal', detail: 'Kata sandi minimal 6 karakter', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        await authStore.register(email.value, password.value, 'Owner', storeName.value);
        await authStore.login(email.value, password.value);
        
        toast.add({ severity: 'success', summary: 'Registrasi Berhasil', detail: 'Akun dan Toko berhasil dibuat. Selamat datang!', life: 3000 });
        router.push('/');
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Registrasi gagal. Silakan coba lagi.';
        toast.add({ severity: 'error', summary: 'Registrasi Gagal', detail: errorMsg, life: 4000 });
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
                        <span class="text-muted-color font-medium">Buat akun baru untuk memulai</span>
                    </div>

                    <form @submit.prevent="handleRegister">
                        <label for="storeName" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nama Toko</label>
                        <InputText id="storeName" type="text" placeholder="Nama Toko / Restoran" class="w-full md:w-[30rem] mb-4" v-model="storeName" :disabled="loading" />

                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email" type="email" placeholder="Alamat email" class="w-full md:w-[30rem] mb-4" v-model="email" :disabled="loading" />

                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Kata Sandi</label>
                        <Password id="password" v-model="password" placeholder="Minimal 6 karakter" :toggleMask="true" class="mb-4" fluid :feedback="false" :disabled="loading"></Password>

                        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Konfirmasi Kata Sandi</label>
                        <Password id="confirmPassword" v-model="confirmPassword" placeholder="Ulangi kata sandi" :toggleMask="true" class="mb-8" fluid :feedback="false" :disabled="loading"></Password>

                        <Button type="submit" label="Daftar" class="w-full mb-4" :loading="loading"></Button>

                        <div class="text-center">
                            <span class="text-muted-color">Sudah punya akun? </span>
                            <router-link to="/auth/login" class="font-medium text-primary no-underline cursor-pointer">Masuk</router-link>
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
