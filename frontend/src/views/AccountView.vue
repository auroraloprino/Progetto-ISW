<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account" class="active"><i class="fas fa-user-circle"></i> Account</RouterLink>
    </div>
  </nav>

  <div class="page-content">
    <h1>Account</h1>
    <InvitesComponent ref="invitesRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import InvitesComponent from '../components/InvitesComponent.vue'

const invitesRef = ref()

onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
})
</script>

<style scoped>
.page-content {
  padding: 2rem;
  margin-top: 100px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 2rem;
}
</style>