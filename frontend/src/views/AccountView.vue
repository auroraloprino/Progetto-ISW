<template>
  
  <div class="page-content">
    <h1>Account</h1>
    <InvitesComponent ref="invitesRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InvitesComponent from '../components/InvitesComponent.vue'

const invitesRef = ref()
</script>

<style scoped>
.page-content {
  padding: 2rem;
  margin-top: 100px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  height: calc(100vh - 100px);
  overflow: hidden;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 2rem;
}
</style>