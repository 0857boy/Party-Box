<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import AppShell from '@/app/layouts/AppShell.vue'
import UpdateToast from '@/components/ui/UpdateToast.vue'

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()
</script>

<template>
  <AppShell>
    <RouterView />
    <UpdateToast
      :need-refresh="needRefresh"
      :offline-ready="offlineReady"
      @close="needRefresh = false; offlineReady = false"
      @update="updateServiceWorker(true)"
    />
  </AppShell>
</template>
