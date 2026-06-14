<script setup lang="ts">
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue';
import OfflineIndicator from '@/components/OfflineIndicator.vue';
</script>

<template>
    <router-view />
    <PWAUpdatePrompt />
    <OfflineIndicator />
</template>

<style scoped></style>

