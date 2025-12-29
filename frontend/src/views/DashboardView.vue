<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="#"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="#"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/dashboard" class="active"><i class="fas fa-user-circle"></i> Account</RouterLink>
    </div>
  </nav>

  <div class="account-wrapper">

    <div class="account-card">

      <div class="avatar">
        <img src="#" />
      </div>

      <div class="username-bar">
        {{ user?.email }}
      </div>

      <div class="account-actions">
        <button class="logout-btn" @click="logoutAndGo">LOGOUT</button>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { currentUser, logout } from '../auth/auth'
import { useRouter } from 'vue-router'

const user = currentUser()
const router = useRouter()

function logoutAndGo() {
  logout()
  router.push('/login')
}
</script>



