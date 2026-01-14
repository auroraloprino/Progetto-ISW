<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useNotifications } from './composables/useNotifications'

const { initialize, cleanup } = useNotifications()

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})
</script>